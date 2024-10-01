import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, BackHandler, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import Recovery from './recovery';

const Index: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [manterLogado, setManterLogado] = useState<boolean>(false);
  const [logado, setLogado] = useState<boolean>(false);
  const [senhaVisivel, setSenhaVisivel] = useState<boolean>(false);
  const [urlWebView, setUrlWebView] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRecovery, setShowRecovery] = useState<boolean>(false);
  const webViewRef = useRef<WebView | null>(null);

  const urlRedirect = 'https://app.smartimobiliario.com.br/inicio/dashboard';
  const urlLogin = 'https://app.smartimobiliario.com.br/usuario/loginSmart';
  const urlLogout = 'https://app.smartimobiliario.com.br/usuario/logout';

  useEffect(() => {
    const verificarLogado = async () => {
      const emailArmazenado = await AsyncStorage.getItem('email');
      const senhaArmazenada = await AsyncStorage.getItem('senha');
      if (emailArmazenado && senhaArmazenada) {
        setEmail(emailArmazenado);
        setSenha(senhaArmazenada);
        setManterLogado(true);
        await handleLogin(emailArmazenado, senhaArmazenada);
      }
    };
    verificarLogado();
  }, []);

  const handleLogin = async (emailParam: string = email, senhaParam: string = senha) => {
    setLoading(true);
    const tipoDispositivo = Platform.OS === 'ios' ? 'iphone' : 'android';
    const body = new URLSearchParams({
      'usuario.email': emailParam,
      'usuario.senha': senhaParam,
      'urlRedirect': urlRedirect,
      'tipoDispositivo': tipoDispositivo,
    }).toString();

    try {
      const resposta = await fetch(urlLogin, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (resposta.ok) {
        setLogado(true);
        setUrlWebView(urlRedirect);

        if (manterLogado) {
          await AsyncStorage.setItem('email', emailParam);
          await AsyncStorage.setItem('senha', senhaParam);
        }
      } else {
        Alert.alert('Login falhou', 'Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Ocorreu um erro durante o login:', error);
      Alert.alert('Ocorreu um erro', 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('email');
    await AsyncStorage.removeItem('senha');
    setLogado(false);
    setEmail('');
    setSenha('');
    setUrlWebView(null);
  };

  const handleNavigationChange = (navState: any) => {
    if (navState.url.includes(urlLogout)) {
      handleLogout();
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      {!logado ? (
        showRecovery ? (
          <Recovery onBack={() => setShowRecovery(false)} />
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
                value={senha}
                onChangeText={setSenha}
                placeholder="Digite sua senha"
                secureTextEntry={!senhaVisivel}
                placeholderTextColor="#bbb"
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setSenhaVisivel(!senhaVisivel)}
              >
                <Text style={styles.toggleText}>
                  {senhaVisivel ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stayLoggedInContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setManterLogado(!manterLogado)}
              >
                <View style={[styles.checkbox, manterLogado && styles.checked]}>
                  {manterLogado && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.stayLoggedInText}>Permanecer logado</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => setShowRecovery(true)}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <>
          {urlWebView && (
            <WebView
              source={{ uri: urlWebView }}
              ref={webViewRef}
              onNavigationStateChange={handleNavigationChange}
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
          )}
        </>
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
    width: '80%',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
  },
  toggleButton: {
    padding: 10,
  },
  toggleText: {
    color: '#fa581a',
    fontWeight: 'bold',
  },
  stayLoggedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 15,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 4,
  },
  checked: {
    backgroundColor: '#fa581a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
  },
  stayLoggedInText: {
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#fa581a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#fa581a',
    textDecorationLine: 'underline',
  },
});

export default Index;
