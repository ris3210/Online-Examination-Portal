document.addEventListener('DOMContentLoaded', () => {
  const examTitleEl = document.getElementById('exam-title');
  const questionsContainer = document.getElementById('questions-container');
  const examForm = document.getElementById('exam-form');
  const examRulesEl = document.getElementById('exam-rules');
  const startBtn = document.getElementById('start-exam-btn');
  const timerContainer = document.getElementById('timer-container');
  const timerEl = document.getElementById('timer');
  const progressEl = document.getElementById('progress');
  const warningEl = document.getElementById('warning');

  const banner = document.createElement('div');
  banner.id = 'custom-banner';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffcc00',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    display: 'none',
    zIndex: '9999',
    maxWidth: '90%',
    fontSize: '15px',
    fontWeight: '500',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  });
  document.body.appendChild(banner);

  function showBanner(message, timeout = 3000) {
    banner.innerHTML = '';
    const msg = document.createElement('span');
    msg.textContent = message;
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = () => (banner.style.display = 'none');
    banner.appendChild(msg);
    banner.appendChild(closeBtn);
    banner.style.display = 'flex';

    setTimeout(() => {
      if (banner.style.display !== 'none') banner.style.display = 'none';
    }, timeout);
  }

  function getExamIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  const examId = getExamIdFromURL();
  let fullExamData = null;
  let totalTime = 0;
  let timeLeft = 0;
  let timerInterval = null;
  let examStarted = false;

  if (!examId) {
    showBanner('No exam selected.');
    if (examForm) examForm.style.display = 'none';
    return;
  }

  function enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  }

  function exitFullScreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }

  function isFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  }

  function handleFullscreenExit() {
    if (examStarted && !isFullscreen()) {
      showBanner('⚠️ Fullscreen exited. Submitting exam...');
      setTimeout(() => submitExam(true), 1000);
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenExit);
  document.addEventListener('webkitfullscreenchange', handleFullscreenExit);
  document.addEventListener('mozfullscreenchange', handleFullscreenExit);
  document.addEventListener('msfullscreenchange', handleFullscreenExit);

  async function loadExam() {
    try {
      const res = await fetch(`/api/exams/${encodeURIComponent(examId)}`);
      if (!res.ok) throw new Error('Failed to load exam');
      const exam = await res.json();

      fullExamData = exam;
      const questionCount = exam.questions.length;
      totalTime = timeLeft = questionCount * 60;

      examTitleEl.textContent = exam.title || 'Untitled Exam';
      document.title = `${exam.title || ''}`;

      const rules = [
        `This exam consists of ${questionCount} question${questionCount !== 1 ? 's' : ''}.`,
        `The total duration of the exam is ${questionCount} minute${questionCount !== 1 ? 's' : ''}.`,
        `Each question carries 1 mark.`,
        `The total marks for this exam is ${questionCount}.`,
        `There is no negative marking.`,
        `Please do not refresh or leave the page during the exam.`,
        `<span style="color: red; font-weight: bold;">If Esc is pressed or fullscreen is exited, the exam will be automatically submitted.</span>`
      ];
      examRulesEl.innerHTML = rules.map(rule => `<li>${rule}</li>`).join('');
      renderQuestions(exam.questions || []);
    } catch (err) {
      examTitleEl.textContent = 'Error loading exam.';
      if (examForm) examForm.style.display = 'none';
      console.error(err);
    }
  }

  function renderQuestions(questions) {
    questionsContainer.innerHTML = '';
    questions.forEach((q, idx) => {
      const div = document.createElement('div');
      div.classList.add('question');
      const title = document.createElement('h3');
      title.textContent = `${idx + 1}. ${q.text}`;
      div.appendChild(title);

      q.options.forEach(opt => {
        const label = document.createElement('label');
        label.style.display = 'block';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q${idx}`;
        radio.value = opt;

        radio.addEventListener('mousedown', function () {
          this.wasChecked = this.checked;
        });
        radio.addEventListener('click', function () {
          if (this.wasChecked) this.checked = false;
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(opt));
        div.appendChild(label);
      });

      questionsContainer.appendChild(div);
    });
  }

  function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function startTimer() {
    timerContainer.classList.remove('hidden');
    timerEl.textContent = `Time Left: ${formatTime(timeLeft)}`;
    progressEl.style.width = `0%`;

    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `Time Left: ${formatTime(timeLeft)}`;

      const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;
      progressEl.style.width = `${progressPercent}%`;

      if (timeLeft === 30) warningEl.style.display = 'block';
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        warningEl.style.display = 'none';
        submitExam(true);
      }
    }, 1000);
  }

  function submitExam(auto = false) {
    if (examSubmitted) return;
    examSubmitted = true;

    const answers = {};
    const unanswered = [];

    questionsContainer.querySelectorAll('.question').forEach((div, idx) => {
      const selected = div.querySelector('input[type="radio"]:checked');
      if (!selected && !auto) unanswered.push(idx + 1);
      answers[`q${idx}`] = selected ? selected.value : null;
    });

    if (unanswered.length && !auto) {
      showBanner(`Please answer question${unanswered.length > 1 ? 's' : ''}: ${unanswered.join(', ')}`);
      return;
    }

    const username = sessionStorage.getItem('username');
    if (!username) return showBanner("User not logged in");

    clearInterval(timerInterval);
    exitFullScreen();

    const now = new Date();
    const submittedAt = now.toISOString(); // consistent format
    sessionStorage.setItem('examSubmittedAt', submittedAt);

    fetch(`/api/exams/${encodeURIComponent(examId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, username })
    })
      .then(async res => {
        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.error || 'Failed to submit exam');
        }

        const { score, total } = result;
        if (score === undefined || total === undefined) {
          throw new Error('Score or total missing in result');
        }

        sessionStorage.setItem('resultScore', score);
        sessionStorage.setItem('resultTotal', total);
        sessionStorage.setItem('examResult', JSON.stringify({ examId, score, total, submittedAt }));
        sessionStorage.setItem('userAnswers', JSON.stringify(answers));
        sessionStorage.setItem('examTitle', fullExamData.title);
        sessionStorage.setItem('questionsSnapshot', JSON.stringify(fullExamData.questions));
        sessionStorage.setItem('source', 'submission');
        window.location.href = 'result.html';
      })
      .catch(err => {
        console.error('Error submitting exam:', err);
        showBanner('Failed to submit exam');
      });
  }

  startBtn.addEventListener('click', () => {
    document.body.classList.remove('instruction-bg');
    startBtn.style.display = 'none';
    document.getElementById('back-btn')?.style?.setProperty('display', 'none');
    examForm.classList.remove('hidden');
    enterFullScreen();
    examStarted = true;
    startTimer();
  });

  examForm.addEventListener('submit', e => {
    e.preventDefault();
    submitExam(false);
  });

  window.addEventListener('keydown', e => {
    if (examStarted) {
      e.preventDefault();
      showBanner("Keyboard is disabled during the exam");
      return false;
    }
  });

  window.addEventListener('contextmenu', e => {
    if (examStarted) {
      e.preventDefault();
      showBanner("Right click not allowed");
      return false;
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && examStarted) {
      showBanner("Tab switching is not allowed");
    }
  });

  loadExam();
});
