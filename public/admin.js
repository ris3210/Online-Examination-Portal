document.addEventListener('DOMContentLoaded', () => {
  const questionCountSection = document.getElementById('question-count-section');
  const generateBtn = document.getElementById('generate-questions-btn');
  const questionCountInput = document.getElementById('question-count');
  const form = document.getElementById('admin-form');
  const questionsContainer = document.getElementById('questions-container');
  const messageEl = document.getElementById('create-message');

  let questionCount = 0;

  generateBtn.addEventListener('click', () => {
    questionCount = parseInt(questionCountInput.value);
    if (!questionCount || questionCount < 1 || questionCount > 100) {
      alert('Please enter a valid number between 1 and 100');
      return;
    }

    questionCountSection.classList.add('hidden');
    form.classList.remove('hidden');

    questionsContainer.innerHTML = '';

    for (let i = 0; i < questionCount; i++) {
      const div = document.createElement('div');
      div.classList.add('question-block');

      div.innerHTML = `
        <h3>Question ${i + 1}</h3>
        <input type="text" name="question_${i}" placeholder="Question Text" required><br><br>
        <input type="text" name="option_${i}_0" placeholder="Option A" required><br><br>
        <input type="text" name="option_${i}_1" placeholder="Option B" required><br><br>
        <input type="text" name="option_${i}_2" placeholder="Option C" required><br><br>
        <input type="text" name="option_${i}_3" placeholder="Option D" required><br><br>
        <label for="correct_${i}">Correct Answer:</label>
        <select name="correct_${i}" id="correct_${i}" required>
          <option value="">Select</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
        <br><br>
      `;

      questionsContainer.appendChild(div);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const questions = [];

    for (let i = 0; i < questionCount; i++) {
      const text = form[`question_${i}`].value;
      const options = [
        form[`option_${i}_0`].value,
        form[`option_${i}_1`].value,
        form[`option_${i}_2`].value,
        form[`option_${i}_3`].value,
      ];
      const correctChar = form[`correct_${i}`].value;

      if (!correctChar) {
        messageEl.textContent = `Please select the correct answer for question ${i + 1}`;
        messageEl.style.color = 'red';
        return;
      }

      const correctAnswer = options['ABCD'.indexOf(correctChar)];

      if (!correctAnswer) {
        messageEl.textContent = `Invalid correct answer for question ${i + 1}`;
        messageEl.style.color = 'red';
        return;
      }

      questions.push({ text, options, correctAnswer });
    }

    try {
      const res = await fetch('/api/admin/create-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questions })
      });

      const result = await res.json();

      if (res.ok) {
        messageEl.textContent = 'Exam created successfully!';
        messageEl.style.color = 'green';
        form.reset();

        questionCountSection.classList.remove('hidden');
        form.classList.add('hidden');
        questionsContainer.innerHTML = '';
        questionCountInput.value = '';
      } else {
        messageEl.textContent = result.error || 'Failed to create exam.';
        messageEl.style.color = 'red';
      }
    } catch (error) {
      console.error('Error:', error);
      messageEl.textContent = 'Something went wrong.';
      messageEl.style.color = 'red';
    }
  });
});
