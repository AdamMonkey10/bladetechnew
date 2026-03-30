const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'quality-details-app',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

