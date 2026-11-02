require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/track');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// API
app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/admin', adminRoutes);

// Landing page at root (no tracking)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'landing.html')));

// Static
app.use(express.static(path.join(__dirname, '..', 'public')));

function renderTrackerPage(link) {
  const base = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const title = (link && link.ogTitle) || 'Verifying your connection...';
  const desc = (link && link.ogDescription) || 'Security check in progress';
  const img = (link && link.ogImage) || '';
  const slug = (link && link.slug) || '';
  const meta = `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  ${img ? `<meta property="og:image" content="${escapeHtml(img)}" />` : ''}
  <meta property="og:type" content="website" />
  <script>window.__TRACK_SLUG__ = ${JSON.stringify(slug)}; window.__LINK_NAME__ = ${JSON.stringify(link ? (link.name || link.slug) : '')};</script>
  `;
  // replace title tag
  let html = base.replace(/<title>.*?<\/title>/s, '');
  html = html.replace('</head>', meta + '</head>');
  return html;
}
function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Tracking link page (with OG tags)
app.get('/t/:slug', async (req, res) => {
  const link = await db.getLinkBySlug(req.params.slug);
  if (!link) return res.status(404).send('Link not found or expired');
  if (db.linkExpired(link)) return res.status(410).send('This link has expired.');
  res.type('html').send(renderTrackerPage(link));
});

// SPA fallback for admin
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));

app.get('/health', (req, res) => res.json({ ok: true, db: db.type, time: new Date().toISOString() }));

(async () => {
  try {
    // env validation
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-to-a-long-random-string') {
        console.error('[fatal] JWT_SECRET must be set in production'); process.exit(1);
      }
      if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'change-me-strong-password') {
        console.error('[fatal] ADMIN_PASSWORD must be changed in production'); process.exit(1);
      }
    }
    await db.init();
    const bcrypt = require('bcryptjs');
    const count = await db.countAdmins();
    if (count === 0) {
      const user = process.env.ADMIN_USERNAME || 'admin';
      const pass = process.env.ADMIN_PASSWORD || 'admin';
      const hash = await bcrypt.hash(pass, 10);
      await db.createAdmin(user, hash);
      console.log(`[init] Admin seeded: ${user}`);
    }
    const server = app.listen(PORT, () => console.log(`[stealth-log] http://localhost:${PORT}  db=${db.type}`));
    const shutdown = () => { console.log('[shutdown] closing...'); server.close(() => process.exit(0)); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (e) {
    console.error('Startup failed:', e);
    process.exit(1);
  }
})();
