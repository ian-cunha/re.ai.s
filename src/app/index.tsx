import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, BackHandler, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import Recovery from './recovery';

const Index: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRecoveryScreen, setShowRecoveryScreen] = useState<boolean>(false);
  const webViewRef = useRef<WebView | null>(null);

  const loginUrl = 'https://app.smartimobiliario.com.br/usuario/loginSmart';
  const dashboardUrl = 'https://app.smartimobiliario.com.br/inicio/dashboard';
  const logoutUrl = 'https://app.smartimobiliario.com.br/usuario/logout';

  useEffect(() => {
    checkAppReinstallation();
    checkStoredCredentials();
  }, []);

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
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setKeepLoggedIn(true);
      await handleLogin(storedEmail, storedPassword);
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

  return (
    <View style={styles.container}>
      {!isLoggedIn ? (
        showRecoveryScreen ? (
          <Recovery onBack={() => setShowRecoveryScreen(false)} />
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>SMART IMOBILIÁRIO</Text>
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
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setKeepLoggedIn(!keepLoggedIn)}>
                <View style={[styles.checkbox, keepLoggedIn && styles.checked]}>
                  {keepLoggedIn && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.stayLoggedInText}>Permanecer logado</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()} disabled={isLoading}>
              <Text style={styles.loginButtonText}>Entrar</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f0f4f7',
    marginTop: Constants.statusBarHeight,
  },
  loginContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa581a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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

export default Index;
