const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS captures (
      id SERIAL PRIMARY KEY,
      ip TEXT, country TEXT, "countryCode" TEXT, region TEXT, city TEXT, zip TEXT,
      lat DOUBLE PRECISION, lon DOUBLE PRECISION, timezone TEXT, isp TEXT, org TEXT, "asInfo" TEXT,
      proxy INTEGER DEFAULT 0, hosting INTEGER DEFAULT 0, mobile INTEGER DEFAULT 0,
      "deviceType" TEXT, "parsedOS" TEXT, "parsedBrowser" TEXT, platform TEXT, vendor TEXT,
      "hardwareConcurrency" TEXT, "deviceMemory" TEXT, "maxTouchPoints" INTEGER,
      "screenWidth" INTEGER, "screenHeight" INTEGER, "screenAvailWidth" INTEGER, "screenAvailHeight" INTEGER,
      "innerWidth" INTEGER, "innerHeight" INTEGER, "pixelRatio" DOUBLE PRECISION, "colorDepth" INTEGER,
      orientation TEXT, "darkMode" TEXT, "reducedMotion" TEXT, "connectionType" TEXT, downlink TEXT, rtt TEXT,
      "saveData" TEXT, "onLine" INTEGER, "batteryLevel" TEXT, "batteryCharging" TEXT, "chargingTime" TEXT,
      "dischargingTime" TEXT, "gpuVendor" TEXT, "gpuRenderer" TEXT, "maxTextureSize" INTEGER, "glVersion" TEXT,
      "canvasFingerprint" TEXT, "audioSampleRate" INTEGER, "audioChannels" INTEGER, "detectedFonts" TEXT,
      "fontCount" INTEGER, "adBlocker" TEXT, "visitCount" INTEGER, "firstVisit" TEXT, "historyLength" INTEGER,
      language TEXT, languages TEXT, "timezoneOffset" INTEGER, "localTime" TEXT, referrer TEXT, "currentURL" TEXT,
      cameras INTEGER, microphones INTEGER, speakers INTEGER, "cookiesEnabled" INTEGER, "doNotTrack" TEXT,
      "webGL" INTEGER, "webRTC" INTEGER, "localStorage" INTEGER, "indexedDB" INTEGER, "serviceWorker" INTEGER,
      "webAssembly" INTEGER, vibration INTEGER, clipboard INTEGER, "speechSynth" INTEGER, notification TEXT,
      "pdfViewerEnabled" INTEGER, gamepad INTEGER, "requestId" TEXT, "rawJson" TEXT,
      "linkId" INTEGER,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE captures ADD COLUMN IF NOT EXISTS "linkId" INTEGER;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_captures_createdAt ON captures("createdAt");`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_captures_ip ON captures(ip);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_captures_country ON captures(country);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_captures_linkId ON captures("linkId");`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT,
      "redirectUrl" TEXT NOT NULL,
      "expiresAt" TIMESTAMPTZ,
      "maxVisits" INTEGER,
      "visitCount" INTEGER NOT NULL DEFAULT 0,
      "ogTitle" TEXT,
      "ogDescription" TEXT,
      "ogImage" TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);`);
}

function quote(c) { return `"${c}"`; }

async function insertCapture(data) {
  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
  const sql = `INSERT INTO captures (${cols.map(quote).join(',')}) VALUES (${placeholders}) RETURNING id`;
  const res = await pool.query(sql, cols.map(c => data[c]));
  return res.rows[0].id;
}

function buildWhere(search, country, from, to, linkId, params) {
  let where = 'WHERE 1=1';
  if (search) {
    where += ' AND (ip ILIKE $' + (params.length+1) + ' OR city ILIKE $' + (params.length+2) + ' OR country ILIKE $' + (params.length+3) + ' OR "parsedBrowser" ILIKE $' + (params.length+4) + ' OR "parsedOS" ILIKE $' + (params.length+5) + ')';
    const q = `%${search}%`;
    params.push(q, q, q, q, q);
  }
  if (country) { params.push(country); where += ` AND country = $${params.length}`; }
  if (from) { params.push(from); where += ` AND "createdAt" >= $${params.length}`; }
  if (to) { params.push(to); where += ` AND "createdAt" <= $${params.length}`; }
  if (linkId) { params.push(linkId); where += ` AND "linkId" = $${params.length}`; }
  return where;
}

async function listCaptures({ limit = 50, offset = 0, search = '', country = '', from = '', to = '', linkId = '' } = {}) {
  const params = [];
  const where = buildWhere(search, country, from, to, linkId, params);
  params.push(limit, offset);
  const sql = `SELECT * FROM captures ${where} ORDER BY id DESC LIMIT $${params.length-1} OFFSET $${params.length}`;
  const res = await pool.query(sql, params);
  return res.rows;
}

async function countCaptures(search = '', country = '', from = '', to = '', linkId = '') {
  const params = [];
  const where = buildWhere(search, country, from, to, linkId, params);
  const res = await pool.query(`SELECT COUNT(*)::int as c FROM captures ${where}`, params);
  return res.rows[0].c;
}

async function getCapture(id) { const res = await pool.query('SELECT * FROM captures WHERE id = $1', [id]); return res.rows[0]; }
async function deleteCapture(id) { return pool.query('DELETE FROM captures WHERE id = $1', [id]); }
async function clearAll() { return pool.query('DELETE FROM captures'); }

async function distinctCountries() {
  const res = await pool.query('SELECT DISTINCT country FROM captures WHERE country IS NOT NULL ORDER BY country');
  return res.rows.map(r => r.country);
}

async function stats(linkId = '') {
  const where = linkId ? 'WHERE "linkId" = $1' : '';
  const p = linkId ? [linkId] : [];
  const total = (await pool.query(`SELECT COUNT(*)::int as c FROM captures ${where}`, p)).rows[0].c;
  const today = (await pool.query(`SELECT COUNT(*)::int as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} DATE("createdAt")=CURRENT_DATE`, p)).rows[0].c;
  const last24h = (await pool.query(`SELECT COUNT(*)::int as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} "createdAt" >= NOW() - INTERVAL '1 day'`, p)).rows[0].c;
  const uniqueIps = (await pool.query(`SELECT COUNT(DISTINCT ip)::int as c FROM captures ${where}`, p)).rows[0].c;
  const vpnCount = (await pool.query(`SELECT COUNT(*)::int as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} proxy=1`, p)).rows[0].c;
  const countries = (await pool.query(`SELECT country, COUNT(*)::int as c FROM captures ${where} GROUP BY country ORDER BY c DESC LIMIT 10`, p)).rows;
  const browsers = (await pool.query(`SELECT "parsedBrowser", COUNT(*)::int as c FROM captures ${where} GROUP BY "parsedBrowser" ORDER BY c DESC LIMIT 10`, p)).rows.map(r => ({ parsedBrowser: r.parsedBrowser, c: r.c }));
  const oses = (await pool.query(`SELECT "parsedOS", COUNT(*)::int as c FROM captures ${where} GROUP BY "parsedOS" ORDER BY c DESC LIMIT 10`, p)).rows.map(r => ({ parsedOS: r.parsedOS, c: r.c }));
  const devices = (await pool.query(`SELECT "deviceType", COUNT(*)::int as c FROM captures ${where} GROUP BY "deviceType"`, p)).rows.map(r => ({ deviceType: r.deviceType, c: r.c }));
  return { total, today, last24h, uniqueIps, vpnCount, countries, browsers, oses, devices };
}

async function getAdmin(username) { const res = await pool.query('SELECT * FROM admins WHERE username = $1', [username]); return res.rows[0]; }
async function createAdmin(username, passwordHash) { return pool.query('INSERT INTO admins (username, "passwordHash") VALUES ($1,$2)', [username, passwordHash]); }
async function countAdmins() { const res = await pool.query('SELECT COUNT(*)::int as c FROM admins'); return res.rows[0].c; }

async function getSetting(key) { const res = await pool.query('SELECT value FROM settings WHERE key = $1', [key]); return res.rows[0] ? res.rows[0].value : null; }
async function setSetting(key, value) { await pool.query('INSERT INTO settings (key,value,"updatedAt") VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, "updatedAt"=NOW()', [key, value]); }
async function getAllSettings() { const res = await pool.query('SELECT key,value FROM settings'); return res.rows; }

function genSlug() { return crypto.randomBytes(6).toString('base64url').toLowerCase(); }

async function createLink({ name, slug, redirectUrl, expiresAt, maxVisits, ogTitle, ogDescription, ogImage }) {
  let s = slug && slug.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
  if (!s) s = genSlug();
  const res = await pool.query(
    'INSERT INTO links (slug,name,"redirectUrl","expiresAt","maxVisits","ogTitle","ogDescription","ogImage") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [s, name || null, redirectUrl, expiresAt || null, maxVisits || null, ogTitle || null, ogDescription || null, ogImage || null]
  );
  return { id: res.rows[0].id, slug: s };
}
async function getLinkBySlug(slug) { const res = await pool.query('SELECT * FROM links WHERE slug = $1', [slug]); return res.rows[0]; }
async function getLinkById(id) { const res = await pool.query('SELECT * FROM links WHERE id = $1', [id]); return res.rows[0]; }
async function listLinks() { const res = await pool.query('SELECT * FROM links ORDER BY id DESC'); return res.rows; }
async function updateLink(id, fields) {
  const map = { name: 'name', redirectUrl: '"redirectUrl"', expiresAt: '"expiresAt"', maxVisits: '"maxVisits"', ogTitle: '"ogTitle"', ogDescription: '"ogDescription"', ogImage: '"ogImage"', active: 'active' };
  const sets = []; const vals = []; let i = 1;
  for (const k of Object.keys(map)) {
    if (fields[k] !== undefined) { sets.push(`${map[k]} = $${i++}`); vals.push(fields[k]); }
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.query(`UPDATE links SET ${sets.join(',')} WHERE id = $${i}`, vals);
}
async function deleteLink(id) {
  await pool.query('DELETE FROM captures WHERE "linkId" = $1', [id]);
  await pool.query('DELETE FROM links WHERE id = $1', [id]);
}
async function incrementLinkVisits(id) { await pool.query('UPDATE links SET "visitCount" = "visitCount" + 1 WHERE id = $1', [id]); }
function linkExpired(link) {
  if (!link || !link.active) return true;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return true;
  if (link.maxVisits && link.visitCount >= link.maxVisits) return true;
  return false;
}

module.exports = {
  type: 'postgres',
  init,
  insertCapture,
  listCaptures,
  countCaptures,
  getCapture,
  deleteCapture,
  clearAll,
  distinctCountries,
  stats,
  getAdmin,
  createAdmin,
  countAdmins,
  getSetting,
  setSetting,
  getAllSettings,
  genSlug,
  createLink,
  getLinkBySlug,
  getLinkById,
  listLinks,
  updateLink,
  deleteLink,
  incrementLinkVisits,
  linkExpired,
  pool,
};
