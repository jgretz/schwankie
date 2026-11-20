export const MIN_SPLIT_LIST_WIDTH = 320;
export const MAX_SPLIT_LIST_WIDTH = 480;
const SPLIT_LIST_RATIO = 0.38;

export type ReaderLayout = {mode: 'full'} | {mode: 'split'; listWidth: number};

type ReaderLayoutInput = {
  width: number;
  height: number;
  hasOpenLink: boolean;
};

export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

// The list fills the window until a link opens in landscape; then it pins left
// and gives the rest of the width to the reader pane.
export function resolveReaderLayout({width, height, hasOpenLink}: ReaderLayoutInput): ReaderLayout {
  if (!isLandscape(width, height) || !hasOpenLink) return {mode: 'full'};

  const listWidth = Math.round(
    Math.min(MAX_SPLIT_LIST_WIDTH, Math.max(MIN_SPLIT_LIST_WIDTH, width * SPLIT_LIST_RATIO)),
  );
  return {mode: 'split', listWidth};
}
