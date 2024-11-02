import {useRequestInfo} from '@www/utils/request-info.ts';
import {useHints} from '../utils/client-hints.tsx';

export function useTheme() {
  const hints = useHints();
  const requestInfo = useRequestInfo();
  return requestInfo.userPrefs.theme ?? hints.theme;
}
