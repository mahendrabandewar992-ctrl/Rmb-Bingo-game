// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

const PORT = process.env.PORT || 4242;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-15' }) : null;
const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET }) : null;

app.use(cors());
app.use(express.json());
app.use(bodyParser.raw({ type: 'application/json' }));

const games = {};
let globalPlayers = 0;

app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const { amount, currency = 'usd', metadata = {} } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount required' });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency, product_data: { name: 'Bingo Tickets' }, unit_amount: amount }, quantity: 1 }],
      success_url: `${process.env.APP_BASE_URL || 'http://localhost:' + PORT}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:' + PORT}/payment-cancel`,
      metadata
    });
    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe session err', err);
    return res.status(500).json({ error: 'Stripe error' });
  }
});

app.post('/create-razorpay-order', async (req, res) => {
  if (!razorpay) return res.status(500).json({ error: 'Razorpay not configured' });
  const { amount, currency = 'INR', receipt } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount required' });
  try {
    const options = { amount, currency, receipt: receipt || `rcpt_${uuidv4()}`, payment_capture: 1 };
    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (err) {
    console.error('Razorpay order err', err);
    return res.status(500).json({ error: 'Razorpay error' });
  }
});

app.post('/create-paypal-order', (req, res) => {
  return res.json({ message: 'Implement PayPal server integration (REST SDK) in production.' });
});

app.post('/webhook/stripe', (req, res) => {
  console.log('Received stripe webhook (raw payload):', req.body.toString ? req.body.toString() : req.body);
  res.json({ received: true });
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  globalPlayers++;
  io.emit('players:count', { count: globalPlayers });

  socket.on('lobby:join', (payload) => {
    console.log('lobby join', payload);
    socket.join('lobby');
    socket.emit('lobby:joined', { ok: true });
  });

  socket.on('game:start', (data) => {
    const gameId = data?.gameId || `game_${Date.now()}`;
    games[gameId] = { drawn: [], players: new Set() };
    io.to('lobby').emit('game:started', { gameId });
    startDrawSequence(gameId);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect', socket.id);
    globalPlayers = Math.max(0, globalPlayers - 1);
    io.emit('players:count', { count: globalPlayers });
  });
});

function startDrawSequence(gameId) {
  const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
  const state = games[gameId];
  if (!state) return;
  let draws = 0;
  const interval = setInterval(() => {
    const remaining = allNumbers.filter(n => !state.drawn.includes(n));
    if (remaining.length === 0 || draws >= 30) {
      clearInterval(interval);
      io.to('lobby').emit('game:ended', { gameId, drawn: state.drawn });
      return;
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.drawn.push(pick);
    draws++;
    io.to('lobby').emit('game:draw', { gameId, number: pick, drawn: state.drawn });
  }, 600);
}

app.get('/', (req, res) => {
  res.json({ ok: true, players: globalPlayers });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Socket.IO ready`);
});
