import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {

  const webViewRef = useRef(null);

  useEffect(() => {
    const loadCredentials = async () => {
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');
      if (username && password) {
        const script = `
            document.getElementById('username').value = '${username}';
            document.getElementById('password').value = '${password}';
          `;
        webViewRef.current.injectJavaScript(script);
      }
    };

    loadCredentials();
  }, []);

  const handleMessage = async (event: { nativeEvent: { data: string; }; }) => {
    const { email, senha } = JSON.parse(event.nativeEvent.data);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('senha', senha);
  };

  return (
    <WebView
      ref={webViewRef}
      style={styles.container}
      source={{ uri: 'https://app.smartimobiliario.com.br/' }}
      onMessage={handleMessage}
      injectedJavaScript={`
        window.ReactNativeWebView.postMessage(JSON.stringify({
          email: document.getElementById('email').value,
          senha: document.getElementById('senha').value
        }));
      `}
      startInLoadingState={true}
      mediaPlaybackRequiresUserAction={false}
      allowFileAccess={true}
      domStorageEnabled={true}
      useWebKit={true}
      cacheEnabled={true}
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
      pullToRefreshEnabled={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
      scalesPageToFit={false}
      userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
      cacheMode="LOAD_CACHE_ELSE_NETWORK"
      mixedContentMode="compatibility"
      incognito={false}
      geolocationEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
