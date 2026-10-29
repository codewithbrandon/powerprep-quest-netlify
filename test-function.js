require('./server/node_modules/dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const { handler } = require('./netlify/functions/api');

function makeEvent({ method, path, body, cookie }) {
  const [rawPath, qs] = path.split('?');
  const queryStringParameters = qs
    ? Object.fromEntries(new URLSearchParams(qs))
    : null;
  return {
    httpMethod: method,
    path: rawPath,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    multiValueHeaders: {},
    queryStringParameters,
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
    requestContext: { requestId: 'test', identity: { sourceIp: '203.0.113.42' } },
  };
}

function extractCookie(res) {
  const raw = res.multiValueHeaders?.['set-cookie']?.[0] || res.headers?.['set-cookie'];
  if (!raw) return null;
  return raw.split(';')[0];
}

(async () => {
  console.log('--- /api/auth/me with no cookie (expect 401) ---');
  const noAuth = await handler(makeEvent({ method: 'GET', path: '/api/auth/me' }), {});
  console.log(noAuth.statusCode, noAuth.body);

  console.log('--- signup ---');
  const signup = await handler(makeEvent({
    method: 'POST',
    path: '/api/auth/signup',
    body: { email: 'netlifytest@example.com', password: 'testpassword123', displayName: 'NetlifyTest' },
  }), {});
  console.log(signup.statusCode, signup.body);
  const cookie = extractCookie(signup);
  console.log('cookie extracted:', cookie);

  console.log('--- /api/profile with cookie ---');
  const profile = await handler(makeEvent({ method: 'GET', path: '/api/profile', cookie }), {});
  console.log(profile.statusCode, profile.body);

  console.log('--- /api/questions?track=PL200&limit=1 ---');
  const questions = await handler(makeEvent({ method: 'GET', path: '/api/questions?track=PL200&limit=1', cookie }), {});
  console.log(questions.statusCode, questions.body.slice(0, 200));

  process.exit(0);
})().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
