// Quick end-to-end check of auth, contacts and real-time chat.
// Requires the server to be running (npm run dev) and Node 18+ (built-in fetch).
const { io } = require('socket.io-client');

const BASE = process.env.BASE_URL || 'http://localhost:5000';

async function api(path, method = 'GET', body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function getUser(name) {
  await api('/api/auth/register', 'POST', {
    username: name,
    email: `${name}@test.com`,
    password: 'secret123',
  }); // 409 if it already exists, which is fine
  const { data } = await api('/api/auth/login', 'POST', { identifier: name, password: 'secret123' });
  return data;
}

(async () => {
  const alice = await getUser('alice');
  const bob = await getUser('bob');
  console.log('Logged in:', alice.user.username, bob.user.username);

  const add = await api('/api/contacts', 'POST', { username: 'bob' }, alice.token);
  console.log('Alice adds Bob:', add.status);

  const bobSocket = io(BASE, { auth: { token: bob.token } });
  const aliceSocket = io(BASE, { auth: { token: alice.token } });
  bobSocket.on('message:new', (m) => console.log('Bob received live:', m.text));

  await Promise.all([
    new Promise((r) => bobSocket.on('connect', r)),
    new Promise((r) => aliceSocket.on('connect', r)),
  ]);

  aliceSocket.emit('message:send', { to: bob.user.id, text: 'Hello Bob!' }, async (ack) => {
    console.log('Alice send result:', ack.ok ? 'ok' : ack.message);
    await new Promise((r) => setTimeout(r, 300));

    const history = await api(`/api/messages/${alice.user.id}`, 'GET', null, bob.token);
    console.log('Bob history with Alice:', history.data.messages.map((m) => m.text));
    process.exit(0);
  });
})().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
