// Entry point: this file only starts the process. It does not know about routes.
// dotenv is loaded first (inside database/pool.js) so DATABASE_URL is read from
// the environment before the very first pool attempt.
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Request API v4 is running on http://localhost:${PORT}`);
});
