import {useState} from 'react';
import {ActivityIndicator, Linking, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {WebView} from 'react-native-webview';
import type {WebViewNavigation} from 'react-native-webview';
import Toast from 'react-native-toast-message';
import {useColors} from '../theme/use-colors';

type ReaderPaneProps = {
  url: string;
  onClose: () => void;
};

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function ReaderPane({url, onClose}: ReaderPaneProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentUrl, setCurrentUrl] = useState(url);
  const [title, setTitle] = useState('');

  function handleNavigation(state: WebViewNavigation) {
    setCurrentUrl(state.url);
    setTitle(state.title);
  }

  function handleOpenExternal() {
    Linking.openURL(currentUrl).catch(function (error: unknown) {
      console.error('[ReaderPane] Failed to open in Safari:', error);
      Toast.show({type: 'error', text1: 'Failed to open in Safari'});
    });
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 8}}
        >
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Close reader"
            style={{padding: 8}}
          >
            <MaterialIcons name="close" size={22} color={colors.accent} />
          </TouchableOpacity>
          <View style={{flex: 1, paddingHorizontal: 8}}>
            <Text numberOfLines={1} style={{fontSize: 15, fontWeight: '600', color: colors.text}}>
              {title || hostOf(currentUrl)}
            </Text>
            <Text numberOfLines={1} style={{fontSize: 11, color: colors.textMuted}}>
              {hostOf(currentUrl)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenExternal}
            accessibilityLabel="Open in Safari"
            style={{padding: 8}}
          >
            <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
      <WebView
        source={{uri: url}}
        onNavigationStateChange={handleNavigation}
        allowsBackForwardNavigationGestures
        startInLoadingState
        renderLoading={() => (
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        style={{flex: 1, backgroundColor: colors.bg}}
      />
    </View>
  );
}
