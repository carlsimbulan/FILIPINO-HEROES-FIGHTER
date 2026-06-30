const { connectDB } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const db = await connectDB();
    const { username, difficulty } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    const field = difficulty + 'win';
    const coinsMap = { easy: 100, medium: 200, hard: 1000 };
    const coins = coinsMap[difficulty] || 100;
    const inc = { overallwins: 1, coins };
    if (['easywin', 'mediumwin', 'hardwin'].includes(field)) inc[field] = 1;

    await db.collection('users').updateOne({ username }, { $inc: inc });
    await db.collection('leaderboards').updateOne(
      { username }, { $inc: { overallwins: 1, [field]: 1 } }, { upsert: true }
    );
    res.json({ success: true, coinsEarned: coins });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
