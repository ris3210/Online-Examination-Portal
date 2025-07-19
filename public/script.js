document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    toggleHomeButton(!isLoggedIn);
    toggleLoggedInBackground(isLoggedIn);
    updateMainContentBoxBlurredBackground(isLoggedIn);
    if (isLoggedIn) {
        showDashboard();
        loadExams();
    } else {
        showLogin();
    }
});

function toggleHomeButton(show) {
    const homeBtn = document.getElementById('home-link');
    if (homeBtn) {
        homeBtn.style.display = show ? 'block' : 'none';
    }
}

function toggleLoggedInBackground(isLoggedIn) {
    const body = document.body;
    if (isLoggedIn) {
        body.classList.add('logged-in-background');
    } else {
        body.classList.remove('logged-in-background');
    }
}

function updateMainContentBoxBlurredBackground(isLoggedIn) {
    const mainContentBox = document.querySelector('.main-content-box');
    if (!mainContentBox) return;
    const loggedOutBgPath = 'ques.jpg';
    const loggedInBgPath = '';
    const currentBgPath = isLoggedIn ? loggedInBgPath : loggedOutBgPath;
    mainContentBox.style.setProperty('--blurred-bg-image', `url('${currentBgPath}')`);
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    clearMessages();
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    document.getElementById('admin-panel-btn').classList.toggle('hidden', !isAdmin);
    toggleHomeButton(false);
    toggleLoggedInBackground(true);
    updateMainContentBoxBlurredBackground(true);
}

function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    clearMessages();
    toggleHomeButton(true);
    toggleLoggedInBackground(false);
    updateMainContentBoxBlurredBackground(false);
}

function showRegister() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    clearMessages();
    toggleHomeButton(true);
    toggleLoggedInBackground(false);
    updateMainContentBoxBlurredBackground(false);
}

document.getElementById('show-register').addEventListener('click', showRegister);
document.getElementById('show-login').addEventListener('click', showLogin);

function clearMessages() {
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorEl = document.getElementById('register-error');
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#.,?])[A-Za-z\d@#.,?]{8,}$/;
    if (password !== confirmPassword) {
        errorEl.style.color = 'red';
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    if (!strongPasswordRegex.test(password)) {
        errorEl.style.color = 'red';
        errorEl.textContent = 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character (@ # . , ?)';
        return;
    }
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
            errorEl.style.color = 'green';
            errorEl.textContent = data.message || 'Registration successful! You can now log in.';
            document.getElementById('register-form').reset();
        } else {
            errorEl.style.color = 'red';
            errorEl.textContent = data.message || 'Registration failed';
        }
    } catch (err) {
        console.error(err);
        errorEl.style.color = 'red';
        errorEl.textContent = 'Error. Please try again.';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('isAdmin', data.isAdmin);
            document.getElementById('login-form').reset();
            showDashboard();
            loadExams();
        } else {
            document.getElementById('login-error').textContent = data.message || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('login-error').textContent = 'Error. Please try again.';
    }
});

async function loadExams() {
    const examListDiv = document.getElementById('exam-list');
    examListDiv.innerHTML = 'Loading exams...';
    try {
        const res = await fetch('/api/exams');
        const exams = await res.json();
        if (!exams.length) {
            examListDiv.innerHTML = '<p>No exams available.</p>';
            return;
        }
        examListDiv.innerHTML = '';
        exams.forEach(exam => {
            const div = document.createElement('div');
            div.classList.add('exam-item');
            div.innerHTML = `
                <h3>${exam.title}</h3>
                <button data-id="${exam._id}">Start Exam</button>
            `;
            div.querySelector('button').addEventListener('click', () => {
                window.location.href = `exam.html?id=${exam._id}`;
            });
            examListDiv.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        examListDiv.innerHTML = '<p style="color:red;">Failed to load exams.</p>';
    }
}

document.getElementById('attempted-btn').addEventListener('click', () => {
    window.location.href = 'attempted-exams.html';
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            sessionStorage.clear();
            showLogin();
        } else {
            alert('Logout failed.');
        }
    } catch (err) {
        console.error(err);
        alert('Logout error');
    }
});

document.getElementById('admin-panel-btn').addEventListener('click', () => {
    window.location.href = 'admin-panel.html';
});
