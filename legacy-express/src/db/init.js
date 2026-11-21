require('dotenv').config();
const db = require('./index');
const bcrypt = require('bcryptjs');

(async () => {
  await db.init();
  const count = await db.countAdmins();
  if (count === 0) {
    const user = process.env.ADMIN_USERNAME || 'admin';
    const pass = process.env.ADMIN_PASSWORD || 'admin';
    const hash = await bcrypt.hash(pass, 10);
    await db.createAdmin(user, hash);
    console.log(`[init] Admin created: ${user}`);
  } else {
    console.log('[init] Admin already exists');
  }
  console.log('[init] DB ready:', db.type);
  process.exit(0);
})();
