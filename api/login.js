const bcrypt = require('bcryptjs');
const { connectDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const db = await connectDB();
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    res.json({
      success: true,
      username: user.username,
      ingamename: user.ingamename,
      overallwins: user.overallwins || 0,
      easywin: user.easywin || 0,
      mediumwin: user.mediumwin || 0,
      hardwin: user.hardwin || 0,
      coins: user.coins || 0,
      activeframe: user.activeframe || 'none',
      framesowned: user.framesowned || ['none'],
      avatar: user.avatar || 'lapu'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
