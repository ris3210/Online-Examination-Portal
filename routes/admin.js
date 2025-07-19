const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const User = require('../models/User');

router.post('/create-exam', async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const newExam = new Exam({ title, questions });
    await newExam.save();
    res.status(201).json({ message: 'Exam created' });
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username isAdmin');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:username/toggle-admin', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isAdmin = !user.isAdmin;
    await user.save();

    res.json({ message: `${user.isAdmin ? 'Granted' : 'Revoked'} admin access to ${username}` });
  } catch (err) {
    console.error('Toggle admin error:', err);
    res.status(500).json({ error: 'Failed to update admin access' });
  }
});

module.exports = router;
