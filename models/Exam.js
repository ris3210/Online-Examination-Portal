const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctAnswer: String
});

const examSchema = new mongoose.Schema({
  title: String,
  questions: [questionSchema]
});

module.exports = mongoose.model('Exam', examSchema);
