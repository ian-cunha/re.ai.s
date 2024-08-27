import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';
import React, { useState } from 'react';

export default function Index() {

  const [uri, seturi] = useState('https://app.smartimobiliario.com.br/inicio/dashboard')

  return (
    <WebView
      style={styles.container}
      onShouldStartLoadWithRequest={
        request => {
          if (request.url.includes('https')) {
            seturi(request.url);
            return false;
          } else return true;
        }
      }
      source={{ uri }}
      allowingReadAccessToURL={uri}
      /*
      onMessage={() => {}}
      ref={() => {}}
      */
      javaScriptEnabled={true}
      setSupportMultipleWindows={false}
      mediaPlaybackRequiresUserAction={false}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      javaScriptCanOpenWindowsAutomatically={true}
      domStorageEnabled={true}
      allowsBackForwardNavigationGestures
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
      originWhitelist={['*']}
      mixedContentMode="always"
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
