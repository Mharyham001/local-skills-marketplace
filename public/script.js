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
const dashboardLink = document.getElementById('dashboardLink');
const logoutBtn = document.getElementById('logoutBtn');
const profileInfo = document.getElementById('profileInfo');
const updateForm = document.getElementById('updateForm');
const updateMessage = document.getElementById('updateMessage');
const artisanOnlyFields = document.getElementById('artisanOnlyFields');

const pageSections = document.querySelectorAll('.page-section');
const sectionLinks = document.querySelectorAll('[data-section]');

function showMessage(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#dc2626' : '#059669';
}

function showSection(sectionId) {
  pageSections.forEach(section => {
    section.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
  }
}

sectionLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = link.dataset.section;
    showSection(sectionId);
  });
});

function renderArtisans(artisans) {
  if (artisanCount) artisanCount.textContent = artisans.length;

  if (!artisans || !artisans.length) {
    if (artisanList) {
      artisanList.innerHTML = '<div class="card">No artisans found.</div>';
    }
    return;
  }

  artisanList.innerHTML = artisans.map(artisan => `
    <div class="card artisan-card">
      <span class="badge">${artisan.skill || 'Artisan'}</span>
      <h3>${artisan.name}</h3>
      <p><strong>Location:</strong> ${artisan.location || '-'}</p>
      <p><strong>Phone:</strong> ${artisan.phone || '-'}</p>
      <p><strong>Experience:</strong> ${artisan.yearsExperience || 0} years</p>
      <p>${artisan.description || 'No description provided.'}</p>
    </div>
  `).join('');
}

async function loadArtisans() {
  try {
    const artisans = await api.getArtisans();
    renderArtisans(artisans);
  } catch (error) {
    if (artisanList) {
      artisanList.innerHTML = '<div class="card">Failed to load artisans.</div>';
    }
  }
}

if (roleSelect) {
  roleSelect.addEventListener('change', () => {
    artisanFields.classList.toggle('hidden', roleSelect.value !== 'artisan');
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
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
        showSection('dashboard');
      } else {
        showMessage(registerMessage, result.message || 'Registration failed', true);
      }
    } catch (error) {
      showMessage(registerMessage, 'Registration failed', true);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const result = await api.login(payload);

      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        showMessage(loginMessage, 'Login successful.');
        loginForm.reset();
        updateAuthUI();
        await loadProfile();
        showSection('dashboard');
      } else {
        showMessage(loginMessage, result.message || 'Login failed', true);
      }
    } catch (error) {
      showMessage(loginMessage, 'Login failed', true);
    }
  });
}

if (searchBtn) {
  searchBtn.addEventListener('click', async () => {
    const search = document.getElementById('searchInput').value.trim();
    const skill = document.getElementById('skillInput').value.trim();
    const location = document.getElementById('locationInput').value.trim();

    try {
      const artisans = await api.getArtisans({ search, skill, location });
      renderArtisans(artisans);
      showSection('artisans');
    } catch (error) {
      if (artisanList) {
        artisanList.innerHTML = '<div class="card">Search failed.</div>';
      }
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();

    if (profileInfo) profileInfo.innerHTML = '';
    if (updateForm) updateForm.classList.add('hidden');
    if (artisanOnlyFields) artisanOnlyFields.classList.add('hidden');

    showSection('home');
  });
}

async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const user = await api.getMe();
    if (user.message) return;

    profileInfo.innerHTML = `
      <h3>Welcome, ${user.name}</h3>
      <p><strong>Email:</strong> ${user.email || '-'}</p>
      <p><strong>Role:</strong> ${user.role || '-'}</p>
      <p><strong>Phone:</strong> ${user.phone || '-'}</p>
      <p><strong>Location:</strong> ${user.location || '-'}</p>
      ${user.role === 'artisan'
        ? `
          <p><strong>Skill:</strong> ${user.skill || '-'}</p>
          <p><strong>Experience:</strong> ${user.yearsExperience || 0} years</p>
          <p><strong>Description:</strong> ${user.description || '-'}</p>
        `
        : `<p><strong>Account Type:</strong> Customer account</p>`
      }
    `;

    updateForm.classList.remove('hidden');
    updateForm.name.value = user.name || '';
    updateForm.phone.value = user.phone || '';
    updateForm.location.value = user.location || '';

    if (user.role === 'artisan') {
      artisanOnlyFields.classList.remove('hidden');
      updateForm.skill.value = user.skill || '';
      updateForm.yearsExperience.value = user.yearsExperience || '';
      updateForm.description.value = user.description || '';
    } else {
      artisanOnlyFields.classList.add('hidden');
      updateForm.skill.value = '';
      updateForm.yearsExperience.value = '';
      updateForm.description.value = '';
    }
  } catch (error) {
    profileInfo.innerHTML = '<p>Failed to load profile.</p>';
  }
}

if (updateForm) {
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(updateForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const result = await api.updateMe(payload);

      if (result.user) {
        showMessage(updateMessage, 'Profile updated successfully.');
        await loadProfile();
        await loadArtisans();
      } else {
        showMessage(updateMessage, result.message || 'Update failed', true);
      }
    } catch (error) {
      showMessage(updateMessage, 'Update failed', true);
    }
  });
}

function updateAuthUI() {
  const token = localStorage.getItem('token');
  if (dashboardLink) dashboardLink.classList.toggle('hidden', !token);
  if (logoutBtn) logoutBtn.classList.toggle('hidden', !token);
}

updateAuthUI();
loadArtisans();

if (localStorage.getItem('token')) {
  loadProfile().then(() => {
    showSection('dashboard');
  });
} else {
  showSection('home');
}