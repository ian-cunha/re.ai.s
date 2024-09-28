import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, BackHandler, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

const Index: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [manterLogado, setManterLogado] = useState<boolean>(false);
  const [logado, setLogado] = useState<boolean>(false);
  const [senhaVisivel, setSenhaVisivel] = useState<boolean>(false);
  const [urlWebView, setUrlWebView] = useState<string | null>(null);

  const webViewRef = useRef<WebView | null>(null);

  const urlRedirect = 'https://app.smartimobiliario.com.br/inicio/dashboard?origem=login';
  const urlLogin = 'https://app.smartimobiliario.com.br/usuario/loginSmart';
  const urlLogout = 'https://app.smartimobiliario.com.br/usuario/logout';

  useEffect(() => {
    const verificarLogado = async () => {
      const emailArmazenado = await AsyncStorage.getItem('email');
      const senhaArmazenada = await AsyncStorage.getItem('senha');
      if (emailArmazenado && senhaArmazenada) {
        setEmail(emailArmazenado);
        setSenha(senhaArmazenada);
        setLogado(true);
        setUrlWebView(urlLogin);
      }
    };

    verificarLogado();
  }, []);

  const handleLogin = async () => {
    const tipoDispositivo = Platform.OS === 'ios' ? 'iphone' : 'android';

    const body = new URLSearchParams({
      'usuario.email': email,
      'usuario.senha': senha,
      urlRedirect: urlRedirect,
      tipoDispositivo: tipoDispositivo,
      tokenNotificacao: '',
    }).toString();

    try {
      const resposta = await fetch(urlLogin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (!resposta.ok) {
        const errorText = await resposta.text();
        console.error('Erro na requisição:', errorText);
        alert('Erro na requisição. Verifique os dados e tente novamente.');
        return;
      }

      const dados = await resposta.json();
      console.log('Status da resposta do login:', resposta.status);
      console.log('Dados da resposta do login:', dados);

      if (dados.success) {
        if (manterLogado) {
          await AsyncStorage.setItem('email', email);
          await AsyncStorage.setItem('senha', senha);
        } else {
          await AsyncStorage.removeItem('email');
          await AsyncStorage.removeItem('senha');
        }
        setLogado(true);
        setUrlWebView(urlLogin);
      } else {
        console.log('Login falhou:', dados.message || 'Verifique suas credenciais.');
        alert('Login falhou: ' + (dados.message || 'Verifique suas credenciais.'));
      }
    } catch (error) {
      console.error('Ocorreu um erro durante o login:', error);
      alert('Ocorreu um erro. Tente novamente.');
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

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      {!logado ? (
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Smart Imobiliário</Text>
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

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
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
    color: '#333',
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
  logoutButton: {
    backgroundColor: '#fa581a',
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Index;
