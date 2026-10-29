require('dotenv').config();
const db = require('./db/database');
const app = require('./app');

const PORT = process.env.PORT || 3001;

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PowerPrep Quest API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
