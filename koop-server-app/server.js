// clean shutdown on `cntrl + c`
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Initialize Koop
const Koop = require('@koopjs/koop-core');
const koop = new Koop();

// Install the Sample Provider
const provider = require('../src');
koop.register(provider, { routePrefix: '/api/v3/connectors', ttl: 10, logLevel: 'info' });

if (process.env.DEPLOY === 'export') {
  module.exports = koop.server;
} else {
  // Start listening for HTTP traffic
  const config = require('config');
  // Set port for configuration or fall back to default
  const port = config.port || 8080;
  koop.server.listen(port);

  const message = `

  Koop ArcGIS Search Provider listening on ${port}
  For more docs visit: https://koopjs.github.io/docs/specs/provider/
  To find providers visit: https://www.npmjs.com/search?q=koop+provider

  Try it out in your browser: http://localhost:${port}/arcgis-search/FeatureServer/0/query
  Or on the command line: curl --silent http://localhost:${port}/arcgis-search/FeatureServer/0/query?returnCountOnly=true

  Press control + c to exit
  `;
  console.log(message);
}
