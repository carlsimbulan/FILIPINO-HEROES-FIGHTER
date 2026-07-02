const { connectDB } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const db = await connectDB();
    const { username, frameId } = req.body;
    const frameCosts = { green: 0, blue: 0, black: 0, gold: 1000, fire: 10000, darkfire: 15000 };
    const cost = frameCosts[frameId];
    if (cost === undefined && frameId !== 'none') return res.status(400).json({ error: 'Invalid frame' });

    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const framesOwned = user.framesowned || [];
    if (framesOwned.includes(frameId)) return res.status(400).json({ error: 'Already owned' });

    // Win-unlock frames (cost = 0) — verify win requirements server-side
    const winReqs = { green: { diff: 'easywin', wins: 20 }, blue: { diff: 'mediumwin', wins: 20 }, black: { diff: 'hardwin', wins: 20 } };
    if (winReqs[frameId]) {
      const req = winReqs[frameId];
      if ((user[req.diff] || 0) < req.wins) {
        return res.status(400).json({ error: 'Win requirement not met' });
      }
      // Grant for free
      await db.collection('users').updateOne({ username }, { $push: { framesowned: frameId } });
      return res.json({ success: true, coinsLeft: user.coins || 0 });
    }

    // Paid frames
    if ((user.coins || 0) < cost) return res.status(400).json({ error: 'Not enough coins' });
    await db.collection('users').updateOne({ username }, {
      $inc: { coins: -cost }, $push: { framesowned: frameId }
    });
    res.json({ success: true, coinsLeft: (user.coins || 0) - cost });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
