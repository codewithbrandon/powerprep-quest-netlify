// Netlify Function entry point. Wraps the same Express app used for local
// dev (server/app.js) with serverless-http, so routes/middleware never
// drift between the two environments.
const serverless = require('serverless-http');
const db = require('../../server/db/database');
const app = require('../../server/app');

// Lambda-style functions get a fresh cold start sometimes and a reused warm
// container other times. Run the (idempotent) schema init once per
// container and cache the promise so warm invocations skip it.
let initPromise = null;
function ensureInit() {
  if (!initPromise) initPromise = db.init();
  return initPromise;
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  await ensureInit();
  return handler(event, context);
};
