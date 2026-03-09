const api = {
  async getArtisans(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/artisans${query ? `?${query}` : ''}`);
    return response.json();
  },

  async register(payload) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async login(payload) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async getMe() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async updateMe(payload) {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
};

const artisanList = document.getElementById('artisanList');
const artisanCount = document.getElementById('artisanCount');
const roleSelect = document.getElementById('roleSelect');
const artisanFields = document.getElementById('artisanFields');
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const searchBtn = document.getElementById('searchBtn');
const dashboardSection = document.getElementById('dashboard');
const dashboardLink = document.getElementById('dashboardLink');
const logoutBtn = document.getElementById('logoutBtn');
const profileInfo = document.getElementById('profileInfo');
const updateForm = document.getElementById('updateForm');
const updateMessage = document.getElementById('updateMessage');

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? '#dc2626' : '#059669';
}

function renderArtisans(artisans) {
  artisanCount.textContent = artisans.length;

  if (!artisans.length) {
    artisanList.innerHTML = '<div class="card">No artisans found.</div>';
    return;
  }

  artisanList.innerHTML = artisans.map(artisan => `
    <div class="card artisan-card">
      <span class="badge">${artisan.skill || 'Artisan'}</span>
      <h3>${artisan.name}</h3>
      <p><strong>Location:</strong> ${artisan.location}</p>
      <p><strong>Phone:</strong> ${artisan.phone}</p>
      <p><strong>Experience:</strong> ${artisan.yearsExperience || 0} years</p>
      <p>${artisan.description || 'No description provided.'}</p>
    </div>
  `).join('');
}

async function loadArtisans() {
  const artisans = await api.getArtisans();
  renderArtisans(artisans);
}

roleSelect.addEventListener('change', () => {
  artisanFields.classList.toggle('hidden', roleSelect.value !== 'artisan');
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(registerForm);
  const payload = Object.fromEntries(formData.entries());

  const result = await api.register(payload);
  if (result.token) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    showMessage(registerMessage, 'Registration successful. You are now logged in.');
    registerForm.reset();
    artisanFields.classList.add('hidden');
    updateAuthUI();
    await loadArtisans();
    await loadProfile();
  } else {
    showMessage(registerMessage, result.message || 'Registration failed', true);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  const result = await api.login(payload);
  if (result.token) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    showMessage(loginMessage, 'Login successful.');
    loginForm.reset();
    updateAuthUI();
    await loadProfile();
  } else {
    showMessage(loginMessage, result.message || 'Login failed', true);
  }
});

searchBtn.addEventListener('click', async () => {
  const search = document.getElementById('searchInput').value.trim();
  const skill = document.getElementById('skillInput').value.trim();
  const location = document.getElementById('locationInput').value.trim();
  const artisans = await api.getArtisans({ search, skill, location });
  renderArtisans(artisans);
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  profileInfo.innerHTML = '';
  updateForm.classList.add('hidden');
});

async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const user = await api.getMe();
  if (user.message) return;

  profileInfo.innerHTML = `
    <h3>Welcome, ${user.name}</h3>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p><strong>Phone:</strong> ${user.phone}</p>
    <p><strong>Location:</strong> ${user.location}</p>
    ${user.role === 'artisan' ? `
      <p><strong>Skill:</strong> ${user.skill || '-'}</p>
      <p><strong>Experience:</strong> ${user.yearsExperience || 0} years</p>
      <p><strong>Description:</strong> ${user.description || '-'}</p>
    ` : ''}
  `;

  updateForm.classList.remove('hidden');
  updateForm.name.value = user.name || '';
  updateForm.phone.value = user.phone || '';
  updateForm.location.value = user.location || '';
  updateForm.skill.value = user.skill || '';
  updateForm.yearsExperience.value = user.yearsExperience || '';
  updateForm.description.value = user.description || '';
}

updateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(updateForm);
  const payload = Object.fromEntries(formData.entries());
  const result = await api.updateMe(payload);

  if (result.user) {
    showMessage(updateMessage, 'Profile updated successfully.');
    await loadProfile();
    await loadArtisans();
  } else {
    showMessage(updateMessage, result.message || 'Update failed', true);
  }
});

function updateAuthUI() {
  const token = localStorage.getItem('token');
  dashboardSection.classList.toggle('hidden', !token);
  dashboardLink.classList.toggle('hidden', !token);
  logoutBtn.classList.toggle('hidden', !token);
}

updateAuthUI();
loadArtisans();
loadProfile();
