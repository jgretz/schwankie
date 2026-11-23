import {useRef, useState} from 'react';
import {ActivityIndicator, Linking, Share, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {WebView} from 'react-native-webview';
import type {WebViewNavigation} from 'react-native-webview';
import Toast from 'react-native-toast-message';
import {useColors} from '../theme/use-colors';
import {openLink} from '../services/open-link';
import {ReaderToolbar} from './ReaderToolbar';
import type {ReaderToolbarAction} from './ReaderToolbar';

// The unfolded Duo in landscape reserves a strip on the right for the clock,
// battery and wifi. The toolbar stacks at the foot of that strip, clear of
// those indicators, and the page runs to the bottom edge. Without a strip
// that wide, it falls back to a bar under the page.
const MIN_RAIL_WIDTH = 44;

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
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = useRef<WebView<object>>(null);

  function handleNavigation(state: WebViewNavigation) {
    setCurrentUrl(state.url);
    setTitle(state.title);
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
  }

  function handleShare() {
    Share.share({url: currentUrl}).catch(function (error: unknown) {
      console.error('[ReaderPane] Failed to share:', error);
      Toast.show({type: 'error', text1: 'Failed to share'});
    });
  }

  // A WebView has no Reader of its own, so this hands the page to the Safari
  // sheet, which opens straight into Reader when the page supports it.
  function handleReader() {
    void openLink({url: currentUrl, colors, source: 'ReaderPane'});
  }

  function handleOpenExternal() {
    Linking.openURL(currentUrl).catch(function (error: unknown) {
      console.error('[ReaderPane] Failed to open in Safari:', error);
      Toast.show({type: 'error', text1: 'Failed to open in Safari'});
    });
  }

  const actions: ReaderToolbarAction[] = [
    {
      icon: 'arrow-back-ios-new',
      label: 'Back',
      onPress: () => webViewRef.current?.goBack(),
      disabled: !canGoBack,
    },
    {
      icon: 'arrow-forward-ios',
      label: 'Forward',
      onPress: () => webViewRef.current?.goForward(),
      disabled: !canGoForward,
    },
    {icon: 'refresh', label: 'Reload', onPress: () => webViewRef.current?.reload()},
    {icon: 'chrome-reader-mode', label: 'Open in Reader', onPress: handleReader},
    {icon: 'ios-share', label: 'Share', onPress: handleShare},
    {icon: 'open-in-new', label: 'Open in Safari', onPress: handleOpenExternal},
  ];
  const hasRail = insets.right >= MIN_RAIL_WIDTH;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.bg,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
      }}
    >
      <View style={{flex: 1, paddingBottom: hasRail ? 0 : insets.bottom}}>
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
          </View>
        </View>
        {/* Explicit type argument: the package's default (`undefined`) intersects
            the props to never, and inference otherwise ties P to this element. */}
        <WebView<object>
          ref={webViewRef}
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
        {hasRail ? null : <ReaderToolbar actions={actions} placement="bar" />}
      </View>
      {hasRail ? (
        <View
          style={{
            width: insets.right,
            justifyContent: 'flex-end',
            paddingBottom: insets.bottom + 12,
          }}
        >
          <ReaderToolbar actions={actions} placement="rail" />
        </View>
      ) : null}
    </View>
  );
}
