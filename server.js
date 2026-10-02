const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'visitor-count.json');

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

function readCount() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    const startingCount = Number.parseInt(process.env.VISIT_COUNT_START || '0', 10);
    return { totalVisits: Number.isFinite(startingCount) && startingCount >= 0 ? startingCount : 0 };
  }
}

function saveCount(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

app.get('/api/visits', (req, res) => {
  let data = readCount();
  data.totalVisits += 1;
  saveCount(data);
  res.set('Cache-Control', 'no-store');
  res.json({ totalVisits: data.totalVisits });
});

const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use('/api/cards/search', searchLimiter);

const cards = [
  {
    name: 'Smokemon',
    priceCents: 2500,
    id: process.env.SMOKEMON_CARD_ID || 'REPLACE_WITH_PRIVATE_CARD_ID'
  }
];

app.get('/api/cards/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (!q) return res.json([]);
  const needle = q.toLowerCase();
  const matches = cards.filter(card =>
    card.name.toLowerCase().includes(needle) || card.id.toLowerCase().includes(needle)
  );
  res.set('Cache-Control', 'no-store');
  res.json(matches.map(card => ({
    name: card.name,
    price: `$${(card.priceCents / 100).toFixed(2)}`,
    id: card.id.length > 4 ? `••••${card.id.slice(-4)}` : '••••'
  })));
});

app.use(express.static(__dirname, { extensions: ['html'] }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`HyperCards running on port ${PORT}`));
