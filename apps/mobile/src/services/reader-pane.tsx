import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {useWindowDimensions} from 'react-native';
import {useColors} from '../theme/use-colors';
import {isLandscape} from '../lib/resolve-reader-layout';
import {openLink} from './open-link';

type ReaderPaneState = {
  canSplit: boolean;
  url: string | null;
  open: (url: string) => void;
  close: () => void;
};

const ReaderPaneContext = createContext<ReaderPaneState>({
  canSplit: false,
  url: null,
  open: function () {},
  close: function () {},
});

export function ReaderPaneProvider({children}: {children: ReactNode}) {
  const {width, height} = useWindowDimensions();
  const canSplit = isLandscape(width, height);
  const [url, setUrl] = useState<string | null>(null);

  // Rotating to portrait drops the pane; resurrecting a stale article on the
  // next rotation back to landscape would be surprising.
  useEffect(
    function () {
      if (!canSplit) setUrl(null);
    },
    [canSplit],
  );

  const close = useCallback(function () {
    setUrl(null);
  }, []);

  const value = useMemo(() => ({canSplit, url, open: setUrl, close}), [canSplit, url, close]);

  return <ReaderPaneContext.Provider value={value}>{children}</ReaderPaneContext.Provider>;
}

export function useReaderPane(): ReaderPaneState {
  return useContext(ReaderPaneContext);
}

// Landscape opens the link in the side pane; portrait keeps the modal browser.
export function useOpenLink(): (url: string, source: string) => void {
  const {canSplit, open} = useReaderPane();
  const colors = useColors();

  return useCallback(
    function (url: string, source: string) {
      if (canSplit) {
        open(url);
        return;
      }
      openLink({url, colors, source});
    },
    [canSplit, open, colors],
  );
}
