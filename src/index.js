'use strict';
const config = require('./config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`ForgeFit Studio running at ${config.baseUrl}`);
  if (config.sessionSecretGenerated) {
    console.log('NOTE: using an ephemeral session secret — set SESSION_SECRET in production.');
  }
});
