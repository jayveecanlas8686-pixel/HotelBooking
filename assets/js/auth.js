// ============================================================
// STAYEASE - AUTH MODULE
// ============================================================

const Auth = {
  getCurrentUser() {
    return DB.get(DB.KEYS.CURRENT_USER);
  },

  login(email, password) {
    const users = DB.getAll(DB.KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { success: false, message: 'Invalid email or password.' };
    if (user.status !== 'active') return { success: false, message: 'Your account has been suspended.' };
    const sessionUser = { ...user };
    delete sessionUser.password;
    DB.set(DB.KEYS.CURRENT_USER, sessionUser);
    return { success: true, user: sessionUser };
  },

  register(data) {
    const users = DB.getAll(DB.KEYS.USERS);
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: 'Email already registered.' };
    }
    const newUser = {
      id: DB.nextId(DB.KEYS.USERS),
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'customer',
      phone: data.phone || '',
      avatar: null,
      address: '',
      nationality: '',
      createdAt: todayStr(),
      status: 'active'
    };
    DB.insert(DB.KEYS.USERS, newUser);
    const sessionUser = { ...newUser };
    delete sessionUser.password;
    DB.set(DB.KEYS.CURRENT_USER, sessionUser);
    return { success: true, user: sessionUser };
  },

  logout() {
    DB.set(DB.KEYS.CURRENT_USER, null);
    window.location.href = 'index.html';
  },

  requireLogin(redirectBack = true) {
    const user = this.getCurrentUser();
    if (!user) {
      const redirect = redirectBack ? encodeURIComponent(window.location.href) : '';
      window.location.href = 'login.html' + (redirect ? '?redirect=' + redirect : '');
      return false;
    }
    return user;
  },

  requireRole(role) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return false;
    }
    if (user.role !== role && !(role === 'owner' && user.role === 'admin')) {
      showToast('Access denied. Insufficient permissions.', 'error');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      return false;
    }
    return user;
  },

  updateProfile(updates) {
    const user = this.getCurrentUser();
    if (!user) return { success: false };
    const updated = DB.update(DB.KEYS.USERS, user.id, updates);
    if (updated) {
      const sessionUser = { ...updated };
      delete sessionUser.password;
      DB.set(DB.KEYS.CURRENT_USER, sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false };
  },

  changePassword(currentPw, newPw) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Not logged in.' };
    const fullUser = DB.findOne(DB.KEYS.USERS, u => u.id === user.id);
    if (!fullUser || fullUser.password !== currentPw) return { success: false, message: 'Current password is incorrect.' };
    DB.update(DB.KEYS.USERS, user.id, { password: newPw });
    return { success: true };
  }
};

// ============================================================
// LOGIN PAGE
// ============================================================

function initLoginPage() {
  const currentUser = DB.get(DB.KEYS.CURRENT_USER);
  if (currentUser) {
    window.location.href = getRedirectUrl();
    return;
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  // Quick-fill demo buttons
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('email').value = btn.dataset.email;
      document.getElementById('password').value = btn.dataset.password;
    });
  });

  const pwToggle = document.getElementById('toggle-password');
  if (pwToggle) {
    pwToggle.addEventListener('click', () => {
      const pw = document.getElementById('password');
      pw.type = pw.type === 'password' ? 'text' : 'password';
      pwToggle.textContent = pw.type === 'password' ? '👁️' : '🙈';
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = form.querySelector('button[type="submit"]');

    clearFormErrors();
    let valid = true;
    if (!email) { showFieldError('email', 'Email is required.'); valid = false; }
    if (!password) { showFieldError('password', 'Password is required.'); valid = false; }
    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    setTimeout(() => {
      const result = Auth.login(email, password);
      if (result.success) {
        showToast('Welcome back, ' + result.user.name + '!', 'success');
        setTimeout(() => { window.location.href = getRedirectUrl(result.user); }, 600);
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    }, 400);
  });
}

function getRedirectUrl(user) {
  const redirect = getUrlParam('redirect');
  if (redirect) return decodeURIComponent(redirect);
  if (user) {
    if (user.role === 'admin') return 'admin-dashboard.html';
    if (user.role === 'owner') return 'owner-dashboard.html';
  }
  return 'index.html';
}

// ============================================================
// REGISTER PAGE
// ============================================================

function initRegisterPage() {
  const currentUser = DB.get(DB.KEYS.CURRENT_USER);
  if (currentUser) { window.location.href = 'index.html'; return; }

  const form = document.getElementById('register-form');
  if (!form) return;

  const pwToggle = document.getElementById('toggle-password');
  if (pwToggle) {
    pwToggle.addEventListener('click', () => {
      const pw = document.getElementById('password');
      pw.type = pw.type === 'password' ? 'text' : 'password';
      pwToggle.textContent = pw.type === 'password' ? '👁️' : '🙈';
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearFormErrors();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const phone = document.getElementById('phone').value.trim();
    const terms = document.getElementById('terms').checked;

    let valid = true;
    if (!name || name.length < 2) { showFieldError('name', 'Full name is required (min 2 chars).'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('email', 'Please enter a valid email.'); valid = false; }
    if (!password || password.length < 6) { showFieldError('password', 'Password must be at least 6 characters.'); valid = false; }
    if (password !== confirm) { showFieldError('confirm-password', 'Passwords do not match.'); valid = false; }
    if (!terms) { showToast('Please agree to the Terms of Service.', 'warning'); valid = false; }
    if (!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    setTimeout(() => {
      const result = Auth.register({ name, email, password, phone });
      if (result.success) {
        showToast('Account created! Welcome to StayEase!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 700);
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    }, 400);
  });
}

// ============================================================
// PROFILE PAGE
// ============================================================

function initProfilePage() {
  const user = Auth.requireLogin();
  if (!user) return;

  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const roleEl = document.getElementById('profile-role');
  const avatarEl = document.getElementById('profile-avatar');
  const memberSinceEl = document.getElementById('member-since');

  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
  if (memberSinceEl) memberSinceEl.textContent = formatDate(user.createdAt);

  // Fill profile form
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.querySelector('#pf-name').value = user.name || '';
    profileForm.querySelector('#pf-email').value = user.email || '';
    profileForm.querySelector('#pf-phone').value = user.phone || '';
    profileForm.querySelector('#pf-address').value = user.address || '';
    profileForm.querySelector('#pf-nationality').value = user.nationality || '';

    profileForm.addEventListener('submit', e => {
      e.preventDefault();
      const updates = {
        name: profileForm.querySelector('#pf-name').value.trim(),
        phone: profileForm.querySelector('#pf-phone').value.trim(),
        address: profileForm.querySelector('#pf-address').value.trim(),
        nationality: profileForm.querySelector('#pf-nationality').value.trim()
      };
      const result = Auth.updateProfile(updates);
      if (result.success) {
        showToast('Profile updated successfully!', 'success');
        if (nameEl) nameEl.textContent = result.user.name;
        if (avatarEl) avatarEl.textContent = result.user.name.charAt(0).toUpperCase();
      } else {
        showToast('Failed to update profile.', 'error');
      }
    });
  }

  // Change password form
  const pwForm = document.getElementById('password-form');
  if (pwForm) {
    pwForm.addEventListener('submit', e => {
      e.preventDefault();
      const current = pwForm.querySelector('#current-pw').value;
      const newPw = pwForm.querySelector('#new-pw').value;
      const confirm = pwForm.querySelector('#confirm-pw').value;
      if (newPw.length < 6) { showToast('New password must be at least 6 characters.', 'warning'); return; }
      if (newPw !== confirm) { showToast('Passwords do not match.', 'warning'); return; }
      const result = Auth.changePassword(current, newPw);
      if (result.success) {
        showToast('Password changed successfully!', 'success');
        pwForm.reset();
      } else {
        showToast(result.message, 'error');
      }
    });
  }

  // Stats
  const bookings = DB.findAll(DB.KEYS.BOOKINGS, b => b.userId === user.id);
  const reviews = DB.findAll(DB.KEYS.REVIEWS, r => r.userId === user.id);
  const wishlist = getWishlistIds(user.id);
  document.getElementById('stat-bookings') && (document.getElementById('stat-bookings').textContent = bookings.length);
  document.getElementById('stat-reviews') && (document.getElementById('stat-reviews').textContent = reviews.length);
  document.getElementById('stat-wishlist') && (document.getElementById('stat-wishlist').textContent = wishlist.length);
  const spent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
  document.getElementById('stat-spent') && (document.getElementById('stat-spent').textContent = formatCurrency(spent));
}

// ============================================================
// FORM HELPERS
// ============================================================

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('input-error');
  let err = field.nextElementSibling;
  if (!err || !err.classList.contains('field-error')) {
    err = document.createElement('span');
    err.className = 'field-error';
    field.parentNode.insertBefore(err, field.nextSibling);
  }
  err.textContent = message;
}

function clearFormErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.field-error').forEach(el => el.remove());
}
