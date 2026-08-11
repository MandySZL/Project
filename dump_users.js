const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./prisma/dev.db');

db.all("SELECT id, name, username, role FROM User", (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
});
