export const APP_NAME = 'Schwankie.com';

export function title(pageTitle?: string) {
  if (!pageTitle) return APP_NAME;

  return `${pageTitle} | ${APP_NAME}`;
}

export function description(pageDescription?: string) {
  if (!pageDescription) {
    return 'Schwankie.com - an alternative memory';
  }

  return pageDescription;
}
