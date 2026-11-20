export const MAX_CENTERED_LIST_WIDTH = 640;
export const MIN_SPLIT_LIST_WIDTH = 320;
export const MAX_SPLIT_LIST_WIDTH = 480;
const SPLIT_LIST_RATIO = 0.38;

export type ReaderLayout =
  | {mode: 'stacked'}
  | {mode: 'centered'; listWidth: number}
  | {mode: 'split'; listWidth: number};

type ReaderLayoutInput = {
  width: number;
  height: number;
  hasOpenLink: boolean;
};

export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

// Portrait keeps today's full-width list; landscape centers the list until a
// link opens, then pins the list left and gives the rest to the reader pane.
export function resolveReaderLayout({width, height, hasOpenLink}: ReaderLayoutInput): ReaderLayout {
  if (!isLandscape(width, height)) return {mode: 'stacked'};

  if (!hasOpenLink) {
    return {mode: 'centered', listWidth: Math.min(width, MAX_CENTERED_LIST_WIDTH)};
  }

  const listWidth = Math.round(
    Math.min(MAX_SPLIT_LIST_WIDTH, Math.max(MIN_SPLIT_LIST_WIDTH, width * SPLIT_LIST_RATIO)),
  );
  return {mode: 'split', listWidth};
}
