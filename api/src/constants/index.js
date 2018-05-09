const createConfigFromPrivate = () => require('./private.js').cosmosConfig;
const createConfigFromEnvironment = () => ({
  uri: process.env.cosmosUri,
  primaryKey: process.env.cosmosPrimaryKey,
});

const serverConfig = (process.env.NODE_ENV === 'DEV' ? createConfigFromPrivate() : createConfigFromEnvironment());

export const cosmosConfig = {
  ...serverConfig,
  database: 'schwankie',
};
