import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';
import React from 'react';

export default function Index() {

  return (
      <WebView
        style={styles.container}
        source={{ uri: 'https://app.smartimobiliario.com.br/atendimento/negocios' }}
        onMessage={() => {}}
        ref={() => {}}
        setSupportMultipleWindows={false}
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
