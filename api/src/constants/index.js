const isDev = process.env.NODE_ENV === 'DEV';
const getValue = (key, server) => (isDev ? require('./private.js')[key] : server);

// cosmos config
const serverConfig = getValue('cosmosConfig', {
  uri: process.env.cosmosUri,
  primaryKey: process.env.cosmosPrimaryKey,
});

export const cosmosConfig = {
  ...serverConfig,
  database: 'schwankie',
};

// auth config
export const authConfig = getValue('adminAuth', {
  user: process.env.user,
  password: process.env.password,
});

// secret
export const secret = getValue('secret', process.env.secret);

// https
export const httpsConfig = getValue('httpsConfig', {
  url: process.env.httpChallengeUrl,
  data: process.env.httpsChallengeData,
});
