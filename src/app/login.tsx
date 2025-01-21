import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, BackHandler, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import Recovery from './recovery';
import Logo from '../../assets/images/logo.png'
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showRecoveryScreen, setShowRecoveryScreen] = useState<boolean>(false);
    const webViewRef = useRef<WebView | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(true);

    const loginUrl = 'https://app.reaisystems.com.br/usuario/loginSmart';
    const dashboardUrl = 'https://app.reaisystems.com.br/inicio/dashboard?origem=login';
    const logoutUrl = 'https://app.reaisystems.com.br/usuario/logout';

    useEffect(() => {
        checkAppReinstallation();
        checkStoredCredentials();
        monitorConnection();
    }, []);

    const monitorConnection = () => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected || false);
            if (state.isConnected && webViewRef.current) {
                webViewRef.current.reload();
            }
        });
        return () => unsubscribe();
    };

    const [biometricType, setBiometricType] = useState<string | null>(null);

    useEffect(() => {
        detectBiometricType();
    }, []);

    const detectBiometricType = async () => {
        try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setBiometricType('Biometria/PIN');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setBiometricType('Face ID/PIN');
            } else {
                setBiometricType(null);
            }
        } catch (error) {
            console.error('Erro ao detectar tipo de biometria:', error);
        }
    };

    const checkBiometricAuth = async (): Promise<boolean> => {
        try {
            // Verifica se o dispositivo suporta autenticação biométrica
            const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
            if (!isBiometricAvailable) {
                Alert.alert('Erro', 'Seu dispositivo não suporta autenticação biométrica.');
                return false;
            }

            // Verifica se a biometria está configurada
            const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
            if (!savedBiometrics) {

                // Tenta autenticar com fallback para PIN
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Autentique-se para continuar',
                    fallbackLabel: 'Use seu PIN',
                    disableDeviceFallback: false, // Importante: Ativa o fallback para PIN
                });

                return result.success;
            }

            // Solicita autenticação biométrica
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autentique-se para continuar',
                fallbackLabel: 'Use seu PIN',
                disableDeviceFallback: false, // Permite fallback para PIN
            });

            return result.success;
        } catch (error) {
            console.error('Erro na autenticação biométrica:', error);
            Alert.alert('Erro', 'Ocorreu um erro durante a autenticação.');
            return false;
        }
    };

    const checkAppReinstallation = async () => {
        const storedInstallId = await AsyncStorage.getItem('installId');
        const currentInstallId = Constants.installationId;

        if (storedInstallId && storedInstallId !== currentInstallId) {
            await AsyncStorage.removeItem('email');
            await AsyncStorage.removeItem('password');
        }

        if (currentInstallId) {
            await AsyncStorage.setItem('installId', currentInstallId);
        }
    };

    const checkStoredCredentials = async () => {
        const storedEmail = await AsyncStorage.getItem('email');
        const storedPassword = await AsyncStorage.getItem('password');
        const isBiometricEnabled = await AsyncStorage.getItem('biometricEnabled');

        if (storedEmail && storedPassword) {
            setEmail(storedEmail);
            setPassword(storedPassword);
            setKeepLoggedIn(true);

            if (isBiometricEnabled === 'true') {
                const success = await checkBiometricAuth();
                if (success) {
                    await handleLogin(storedEmail, storedPassword);
                } else {
                    Alert.alert('Autenticação Requerida', 'A biometria é necessária para continuar.');
                }
            } else {
                await handleLogin(storedEmail, storedPassword);
            }
        }
    };

    const handleLogin = async (emailParam: string = email, passwordParam: string = password) => {
        setIsLoading(true);

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: buildRequestBody(emailParam, passwordParam),
            });

            if (response.ok) {
                setIsLoggedIn(true);
                setWebViewUrl(dashboardUrl);
                if (keepLoggedIn) {
                    await storeCredentials(emailParam, passwordParam);
                }
            } else {
                showAlert('Falha no login', 'Email ou senha inválido.');
            }
        } catch (error) {
            showAlert('Erro', 'Ocorreu um erro. Tente novamente.');
            console.error('Erro no login:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const buildRequestBody = (emailParam: string, passwordParam: string) => {
        return new URLSearchParams({
            'usuario.email': emailParam,
            'usuario.senha': passwordParam,
            'urlRedirect': dashboardUrl,
            'tipoDispositivo': Platform.OS === 'ios' ? 'iphone' : 'android',
        }).toString();
    };

    const storeCredentials = async (email: string, password: string) => {
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('email');
        await AsyncStorage.removeItem('password');
        setIsLoggedIn(false);
        setEmail('');
        setPassword('');
        setWebViewUrl(null);
    };

    const handleNavigationChange = (navState: any) => {
        if (navState.url.includes(logoutUrl)) {
            handleLogout();
        }
    };

    const handleShouldStartLoadWithRequest = (request: any) => {
        const allowedUrls = [
            'https://api.whatsapp.com/',
            'https://web.whatsapp.com/',
            'https://whatsapp.com/',
            'whatsapp://',
            'https://www.facebook.com/',
            'https://twitter.com/',
            'https://x.com/',
            'https://instagram.com/',
        ];

        if (request.url.endsWith('.pdf')) {
            Linking.openURL(request.url);
            return false;
        }

        if (allowedUrls.some(url => request.url.startsWith(url))) {
            Linking.openURL(request.url);
            return false;
        }

        return true;
    };

    useEffect(() => {
        const handleBackPress = () => {
            if (webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => backHandler.remove();
    }, []);

    const showAlert = (title: string, message: string) => {
        Alert.alert(title, message);
    };

    const LoadingIndicator = () => {
        return (
            <View style={styles.overlayInside}>
                <ActivityIndicator size="large" color="#fa581a" />
            </View>
        );
    };

    const renderDisconnected = () => (
        <View style={styles.disconnectedContainer}>
            <Text style={styles.disconnectedText}>Você está offline</Text>
            <TouchableOpacity onPress={() => NetInfo.fetch().then((state) => setIsConnected(state.isConnected || false))}>
                <Text style={styles.tryAgainText}>Tentar novamente</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {!isConnected ? (
                renderDisconnected()
            ) : !isLoggedIn ? (
                showRecoveryScreen ? (
                    <Recovery onBack={() => setShowRecoveryScreen(false)} />
                ) : (
                    <View style={styles.loginContainer}>
                        <Image source={Logo} style={styles.logo} />
                        <Text style={styles.subtitle}>Faça login na sua conta</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Digite seu email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#bbb"
                        />
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.inputPassword}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Digite sua senha"
                                secureTextEntry={!passwordVisible}
                                placeholderTextColor="#bbb"
                            />
                            <TouchableOpacity style={styles.toggleButton} onPress={() => setPasswordVisible(!passwordVisible)}>
                                <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="#fa581a" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.stayLoggedInContainer}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={async () => {
                                    setKeepLoggedIn(!keepLoggedIn);
                                    if (!keepLoggedIn) {
                                        await AsyncStorage.setItem('biometricEnabled', 'true');
                                    } else {
                                        await AsyncStorage.removeItem('biometricEnabled');
                                    }
                                }}
                            >
                                <View style={[styles.checkbox, keepLoggedIn && styles.checked]}>
                                    {keepLoggedIn && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.stayLoggedInText}>Permanecer logado</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={async () => {
                                if (keepLoggedIn) {
                                    const success = await checkBiometricAuth();
                                    if (success) {
                                        await handleLogin();
                                    } else {
                                        Alert.alert('Autenticação Requerida', 'A biometria é necessária para continuar.');
                                    }
                                } else {
                                    await handleLogin();
                                }
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>
                                {keepLoggedIn ? `Login com ${biometricType || 'Biometria'}` : 'Entrar'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => setShowRecoveryScreen(true)}>
                            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                webViewUrl && (
                    <WebView
                        source={{ uri: webViewUrl }}
                        ref={webViewRef}
                        mixedContentMode={'always'}
                        originWhitelist={['*']}
                        startInLoadingState={true}
                        renderLoading={LoadingIndicator}
                        onNavigationStateChange={handleNavigationChange}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        javaScriptEnabled={true}
                        allowsBackForwardNavigationGestures
                        cacheEnabled={true}
                        sharedCookiesEnabled={true}
                        pullToRefreshEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        setSupportMultipleWindows={false}
                        allowFileAccess={true}
                        allowFileAccessFromFileURLs={true}
                        allowUniversalAccessFromFileURLs={true}
                    />
                )
            )}

            {isLoading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fa581a" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fa581a',
        padding: 15,
        borderRadius: 8,
        marginTop: 15,
    },
    biometricButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
    },
    disconnectedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    disconnectedText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fa581a',
        marginBottom: 10,
    },
    tryAgainText: {
        backgroundColor: '#fa581a',
        color: 'white',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f0f4f7',
        marginTop: Platform.OS === 'ios' ? Constants.statusBarHeight : 0,
        marginBottom: Platform.OS === 'ios' ? 20 : 'auto',
    },
    loginContainer: {
        padding: 20,
    },
    logo: {
        width: 200,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    inputPassword: {
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#fafafa',
        width: '90%',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
    toggleButton: {
        marginRight: 10,
    },
    toggleText: {
        color: '#fa581a',
        fontSize: 16,
    },
    stayLoggedInContainer: {
        marginBottom: 20,
        marginTop: 15,
        alignItems: 'center',
        flexDirection: 'row',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    checked: {
        backgroundColor: '#fa581a',
    },
    checkmark: {
        color: '#fff',
    },
    stayLoggedInText: {
        fontSize: 16,
        color: '#666',
    },
    loginButton: {
        backgroundColor: '#fa581a',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    forgotPasswordContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: '#fa581a',
    },
    loadingText: {
        color: '#fa581a',
        marginTop: 10,
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayInside: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Login;
