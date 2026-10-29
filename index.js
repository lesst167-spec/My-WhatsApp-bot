const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state });

  if (!state.creds.registered) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const code = await sock.requestPairingCode('233266921504');
      console.log('YOUR PAIRING CODE:', code);
    } catch (e) {
      console.log('Code request fail, e go retry...', e.message);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('Bot don connect!');
    } else if (connection === 'close') {
      const loggedOut = (lastDisconnect?.error)?.output?.statusCode === DisconnectReason.loggedOut;
      console.log('Connection close, e dey restart...');
      if (!loggedOut) startBot();
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    console.log('New message:', JSON.stringify(msg.message));
  });
}
startBot();
