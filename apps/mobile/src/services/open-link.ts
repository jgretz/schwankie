import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

type OpenLinkOptions = {
  url: string;
  colors: {
    accent: string;
    bg: string;
  };
  source: string;
};

export async function openLink({url, colors, source}: OpenLinkOptions): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: 'close',
      controlsColor: colors.accent,
      toolbarColor: colors.bg,
      enableBarCollapsing: true,
      readerMode: true,
    });
  } catch (error) {
    console.error(`[${source}] Failed to open URL:`, error);
    Toast.show({
      type: 'error',
      text1: 'Failed to open link',
      text2: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
