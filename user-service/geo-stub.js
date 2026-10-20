/**
 * Geo Service stub - a fake of the downstream service user-service depends on.
 * Use it for MANUAL testing in Flashpost. Karate starts its own mock on the
 * same port, so stop this stub before running the Karate suite.
 *
 * Magic zip codes that simulate dependency failures (Tier 6 "error flows"):
 *   00000 -> 404 (unknown zip)
 *   99999 -> 500 (geo service crashes)
 *   77777 -> answers after 3 s (user-service times out after 2 s -> 504)
 */
const express = require('express');

const PORT = Number(process.env.GEO_PORT) || 18090;
const ZIPS = {
  '41101': { city: 'Pune', state: 'Maharashtra', timezone: 'Asia/Kolkata' },
  '56001': { city: 'Bengaluru', state: 'Karnataka', timezone: 'Asia/Kolkata' },
  '50001': { city: 'Hyderabad', state: 'Telangana', timezone: 'Asia/Kolkata' },
  '10001': { city: 'New York', state: 'NY', timezone: 'America/New_York' },
};

const app = express();

app.get('/geo/:zip', (req, res) => {
  const { zip } = req.params;
  if (zip === '99999') return res.status(500).json({ error: 'geo database offline' });
  if (zip === '77777') {
    return setTimeout(() => res.json({ zip, city: 'Slowtown', state: 'NA', timezone: 'UTC' }), 3000);
  }
  const geo = ZIPS[zip];
  if (!geo) return res.status(404).json({ error: `unknown zip ${zip}` });
  res.json({ zip, ...geo });
});

app.listen(PORT, () => console.log(`geo-stub listening on http://localhost:${PORT}`));
