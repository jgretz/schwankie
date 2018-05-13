const isDev = process.env.NODE_ENV === 'DEV';

// cosmos config
const createConfigFromPrivate = () => require('./private.js').cosmosConfig;
const createConfigFromEnvironment = () => ({
  uri: process.env.cosmosUri,
  primaryKey: process.env.cosmosPrimaryKey,
});

const serverConfig = (isDev ? createConfigFromPrivate() : createConfigFromEnvironment());

export const cosmosConfig = {
  ...serverConfig,
  database: 'schwankie',
};

// auth config
export const authConfig = (isDev ? require('./private.js').adminAuth : {
  user: process.env.user,
  password: process.env.password,
});

// secret
export const secret = (isDev ? require('./private.js').secret : process.env.secret);
