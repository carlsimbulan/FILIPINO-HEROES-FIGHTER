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
    const { username, password, ingamename } = req.body;
    if (!username || !password || !ingamename)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await db.collection('users').findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      username, password: hashed, ingamename,
      overallwins:0, easywin:0, mediumwin:0, hardwin:0,
      coins:0, activeframe:'none', framesowned:['none'], avatar:'lapu',
      createdAt: new Date()
    };
    const result = await db.collection('users').insertOne(user);
    await db.collection('leaderboards').insertOne({
      userId: result.insertedId, username, ingamename,
      overallwins:0, easywin:0, mediumwin:0, hardwin:0,
    });
    res.json({ success: true, ingamename });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
