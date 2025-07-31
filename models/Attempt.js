const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  username: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Exam' },
  examTitle: { type: String, required: true },
  answers: { type: Object, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  questionsSnapshot: [{
    text: String,
    options: [String],
    correctAnswer: String
  }]
});

module.exports = mongoose.model('Attempt', AttemptSchema);
