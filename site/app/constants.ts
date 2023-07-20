export const URLS = {
  API: process.env.API_URL,
  SEARCH: `${process.env.API_URL}/search?`,
  TAGS: `${process.env.API_URL}/tags`,
  SAVE_LINK: `${process.env.API_URL}/crud/links`,
};

export const ROUTES = {
  AUTH: '/admin/auth/google',
  LOGIN: '/admin/login',
  LINKS: '/admin/links',
};
