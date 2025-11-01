export default async function handler(req, res) {
  // Minimal health endpoint to validate API routing on Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    return res.status(200).json({
      status: 'ok',
      region: process.env.VERCEL_REGION || 'unknown',
      time: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'unexpected_error' });
  }
}