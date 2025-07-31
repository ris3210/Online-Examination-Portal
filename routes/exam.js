const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Attempt = require('../models/Attempt');

router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find({}, '_id title');
    const examsFormatted = exams.map(exam => ({
      _id: exam._id.toString(),
      title: exam.title,
    }));
    res.json(examsFormatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const examObj = exam.toObject();
    examObj._id = examObj._id.toString();
    examObj.questions = examObj.questions.map(q => ({
      _id: q._id.toString(),
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    res.json(examObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving exam' });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const userAnswers = req.body.answers;
    const username = req.body.username || 'anonymous';

    if (!userAnswers || typeof userAnswers !== 'object') {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const existingAttempt = await Attempt.findOne({ examId: exam._id, username });
    if (existingAttempt) {
      return res.status(409).json({
        error: 'Exam already submitted.',
        score: existing.score,
        total: existing.total,
        attemptId: existing._id
      });
    }

    let score = 0;
    const total = exam.questions.length;

    exam.questions.forEach((question, index) => {
      const questionId = `q${index}`;
      const userAnswer = userAnswers[questionId];
      if (
        userAnswer &&
        userAnswer.toString().trim() === question.correctAnswer.toString().trim()
      ) {
        score++;
      }
    });

    const newAttempt = new Attempt({
      username,
      examId: exam._id,
      examTitle: exam.title,
      answers: userAnswers,
      score,
      total,
      questionsSnapshot: exam.questions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer
      }))
    });

    await newAttempt.save();

    res.json({
      message: 'Exam submitted successfully',
      score,
      total,
      attemptId: newAttempt._id
    });

  } catch (err) {
    console.error('Error submitting exam:', err);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    exam.title = title;

    const updatedQuestions = questions.map((q, i) => {
      const existingQ = exam.questions[i];

      return {
        text: q.text,
        options: q.options,
        correctAnswer:
          q.correctAnswer !== null && q.correctAnswer !== undefined
            ? q.correctAnswer
            : existingQ?.correctAnswer ?? null
      };
    });

    exam.questions = updatedQuestions;

    await exam.save();

    res.json({ message: 'Exam updated successfully' });
  } catch (err) {
    console.error('Error updating exam:', err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

module.exports = router;
