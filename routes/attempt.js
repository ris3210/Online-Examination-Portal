const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');

router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username?.trim();

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const attempts = await Attempt.find({ username })
      .sort({ submittedAt: -1 })
      .select('-__v');

    res.json(attempts);
  } catch (err) {
    console.error('Error fetching attempts:', err);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

module.exports = router;
