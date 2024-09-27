import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

const Index: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [stayLoggedIn, setStayLoggedIn] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  const webViewRef = useRef<WebView | null>(null);

  const loginUrl = 'https://app.smartimobiliario.com.br/';
  const logoutUrl = 'https://app.smartimobiliario.com.br/usuario/logout';

  const injectJS = `
    document.getElementById('email').value = '${email}';
    document.getElementById('senha').value = '${password}';
    document.forms[0].submit();
  `;

  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('senha');
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        setLoggedIn(true);
      }
    };
    checkLoggedIn();
  }, []);

  const handleLogin = async () => {
    if (stayLoggedIn) {
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('senha', password);
    } else {
      await AsyncStorage.removeItem('email');
      await AsyncStorage.removeItem('senha');
    }
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('email');
    await AsyncStorage.removeItem('senha');
    setLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  const handleNavigationChange = (navState: any) => {
    if (navState.url.includes(logoutUrl)) {
      handleLogout();
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true; // impede o fechamento do aplicativo
      }
      return false; // permite o fechamento se não houver histórico no WebView
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      {!loggedIn ? (
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
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              secureTextEntry={!passwordVisible}
              placeholderTextColor="#bbb"
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Text style={styles.toggleText}>
                {passwordVisible ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stayLoggedInContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setStayLoggedIn(!stayLoggedIn)}
            >
              <View style={[styles.checkbox, stayLoggedIn && styles.checked]}>
                {stayLoggedIn && <Text style={styles.checkmark}>✓</Text>}
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
          <WebView
            source={{ uri: loginUrl }}
            ref={webViewRef}
            onLoadEnd={() => {
              if (loggedIn && webViewRef.current) {
                webViewRef.current.injectJavaScript(injectJS);
              }
            }}
            onNavigationStateChange={handleNavigationChange}
            javaScriptEnabled={true}
            setSupportMultipleWindows={false}
            mediaPlaybackRequiresUserAction={false}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptCanOpenWindowsAutomatically={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures
            cacheEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            pullToRefreshEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            scalesPageToFit={false}
            mixedContentMode="always"
            geolocationEnabled={true}
          />
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
