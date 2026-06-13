// ============================================================
// STAYEASE - APP UTILITIES
// ============================================================

// Utility: format currency
function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Utility: format date for display
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toISOString().split('T')[0];
}

// Utility: calculate nights between two dates
function calcNights(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

// Utility: today string yyyy-mm-dd
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Utility: add days to date string
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Utility: generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Utility: generate booking reference
function generateBookingRef() {
  const ts = Date.now().toString().slice(-7);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return 'BK' + ts + rand;
}

// Utility: get URL param
function getUrlParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Utility: render star rating HTML
function renderStars(rating, interactive = false, name = 'rating') {
  const r = parseFloat(rating) || 0;
  if (interactive) {
    let html = '<div class="star-input">';
    for (let i = 5; i >= 1; i--) {
      html += `<input type="radio" id="${name}-${i}" name="${name}" value="${i}" ${i === Math.round(r) ? 'checked' : ''}>
               <label for="${name}-${i}" title="${i} stars">&#9733;</label>`;
    }
    html += '</div>';
    return html;
  }
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += '<span class="star full">&#9733;</span>';
    else if (i === full + 1 && half) html += '<span class="star half">&#9733;</span>';
    else html += '<span class="star empty">&#9733;</span>';
  }
  html += `<span class="rating-num">${r.toFixed(1)}</span></span>`;
  return html;
}

// Utility: amenity icon + label map
const AMENITY_MAP = {
  'pool': { icon: '🏊', label: 'Swimming Pool' },
  'spa': { icon: '💆', label: 'Spa & Wellness' },
  'wifi': { icon: '📶', label: 'Free WiFi' },
  'gym': { icon: '🏋️', label: 'Fitness Center' },
  'restaurant': { icon: '🍽️', label: 'Restaurant' },
  'bar': { icon: '🍹', label: 'Bar & Lounge' },
  'beach': { icon: '🏖️', label: 'Private Beach' },
  'parking': { icon: '🚗', label: 'Free Parking' },
  'ac': { icon: '❄️', label: 'Air Conditioning' },
  'concierge': { icon: '🛎️', label: 'Concierge' },
  'kids-club': { icon: '🎪', label: 'Kids Club' },
  'water-sports': { icon: '🤿', label: 'Water Sports' },
  'diving': { icon: '🤿', label: 'Scuba Diving' },
  'kayaking': { icon: '🚣', label: 'Kayaking' },
  'yoga': { icon: '🧘', label: 'Yoga Classes' },
  'fireplace': { icon: '🔥', label: 'Fireplace' },
  'meeting-rooms': { icon: '📊', label: 'Meeting Rooms' },
  'airport-shuttle': { icon: '🚌', label: 'Airport Shuttle' },
  'business-center': { icon: '💼', label: 'Business Center' },
  'laundry': { icon: '👗', label: 'Laundry Service' },
  'kids-pool': { icon: '🏊', label: "Kids' Pool" },
  'surfing': { icon: '🏄', label: 'Surfing' },
  'island-hopping': { icon: '⛵', label: 'Island Hopping' },
  'bikes': { icon: '🚲', label: 'Bicycle Rental' },
  'island-tours': { icon: '🗺️', label: 'Island Tours' },
  'garden': { icon: '🌿', label: 'Garden' },
  'shuttle': { icon: '🚌', label: 'Hotel Shuttle' }
};

function renderAmenityBadge(key, showLabel = true) {
  const a = AMENITY_MAP[key] || { icon: '✓', label: key };
  return `<span class="amenity-badge" title="${a.label}">${a.icon}${showLabel ? ' ' + a.label : ''}</span>`;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ============================================================
// MODAL SYSTEM
// ============================================================

function showModal(title, bodyHTML, buttons = [], size = 'md') {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-${size}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${buttons.length ? `<div class="modal-footer">${buttons.map(b => `<button class="${b.class || 'btn btn-secondary'}" onclick="${b.onclick}">${b.label}</button>`).join('')}</div>` : ''}
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  setTimeout(() => overlay.classList.add('active'), 10);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 300);
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function getNavHTML(currentUser) {
  const isLoggedIn = !!currentUser;
  const isOwner = currentUser && currentUser.role === 'owner';
  const isAdmin = currentUser && currentUser.role === 'admin';

  return `
  <nav class="navbar">
    <div class="container nav-container">
      <a href="index.html" class="nav-logo">
        <span class="logo-icon">🏨</span> StayEase
      </a>
      <button class="nav-toggle" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
      <ul class="nav-links" id="nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="hotels.html">Hotels</a></li>
        <li><a href="search-results.html">Search</a></li>
        <li><a href="pricing.html">Pricing</a></li>
        <li><a href="contact.html">Contact</a></li>
        ${isOwner ? '<li><a href="owner-dashboard.html">My Dashboard</a></li>' : ''}
        ${isAdmin ? '<li><a href="admin-dashboard.html">Admin</a></li>' : ''}
        ${isLoggedIn ? `
          <li class="nav-dropdown">
            <button class="nav-user-btn" onclick="toggleUserMenu()">
              <span class="user-avatar-sm">${currentUser.name.charAt(0).toUpperCase()}</span>
              ${currentUser.name.split(' ')[0]}
              <span class="dropdown-arrow">▾</span>
            </button>
            <ul class="dropdown-menu" id="user-dropdown">
              <li><a href="profile.html">👤 My Profile</a></li>
              <li><a href="my-bookings.html">📋 My Bookings</a></li>
              <li><a href="wishlist.html">❤️ Wishlist</a></li>
              <li><a href="reviews.html">⭐ My Reviews</a></li>
              <li class="dropdown-divider"></li>
              <li><a href="#" onclick="handleLogout(); return false;">🚪 Logout</a></li>
            </ul>
          </li>
        ` : `
          <li><a href="login.html" class="btn btn-outline-white btn-sm">Login</a></li>
          <li><a href="register.html" class="btn btn-primary btn-sm">Sign Up</a></li>
        `}
      </ul>
    </div>
  </nav>`;
}

function getFooterHTML() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">🏨 StayEase</div>
          <p>Find and book the perfect hotel or resort for every occasion. Discover extraordinary places to stay around the Philippines and beyond.</p>
          <div class="footer-social">
            <a href="#" class="social-link">📘</a>
            <a href="#" class="social-link">📸</a>
            <a href="#" class="social-link">🐦</a>
            <a href="#" class="social-link">▶️</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="hotels.html">All Hotels</a></li>
            <li><a href="search-results.html?city=Boracay">Boracay</a></li>
            <li><a href="search-results.html?city=Palawan">Palawan</a></li>
            <li><a href="search-results.html?city=Cebu">Cebu</a></li>
            <li><a href="search-results.html?category=resort">Resorts</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="contact.html">About Us</a></li>
            <li><a href="pricing.html">For Hotel Owners</a></li>
            <li><a href="contact.html">Contact Us</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="contact.html">Help Center</a></li>
            <li><a href="my-bookings.html">Manage Booking</a></li>
            <li><a href="contact.html">Cancel Reservation</a></li>
            <li><a href="#">Travel Insurance</a></li>
          </ul>
          <div class="footer-contact">
            <p>📞 +1 (800) STAYEASE</p>
            <p>✉️ help@stayease.com</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2025 StayEase. All rights reserved. Built as a portfolio demo.</p>
        <div class="payment-icons">
          <span class="payment-badge">VISA</span>
          <span class="payment-badge">MC</span>
          <span class="payment-badge">PayPal</span>
          <span class="payment-badge">GCash</span>
        </div>
      </div>
    </div>
  </footer>`;
}

function toggleMobileNav() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

document.addEventListener('click', e => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && !e.target.closest('.nav-dropdown')) {
    dropdown.classList.remove('open');
  }
  const nav = document.getElementById('nav-links');
  if (nav && !e.target.closest('.navbar')) {
    nav.classList.remove('open');
  }
});

function handleLogout() {
  DB.set(DB.KEYS.CURRENT_USER, null);
  showToast('Logged out successfully.', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

// Inject nav + footer and highlight active link
function initPage() {
  const currentUser = DB.get(DB.KEYS.CURRENT_USER);

  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) navPlaceholder.innerHTML = getNavHTML(currentUser);

  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) footerPlaceholder.innerHTML = getFooterHTML();

  // Highlight active nav
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.split('?')[0] === currentPath) link.classList.add('active');
  });

  return currentUser;
}

// ============================================================
// PAGINATION
// ============================================================

function renderPagination(container, total, current, perPage, onPage) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="pagination">';
  if (current > 1) html += `<button class="page-btn" onclick="${onPage}(${current - 1})">‹ Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - current) <= 2) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${onPage}(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 3) {
      html += `<span class="page-dots">...</span>`;
    }
  }
  if (current < pages) html += `<button class="page-btn" onclick="${onPage}(${current + 1})">Next ›</button>`;
  html += '</div>';
  container.innerHTML = html;
}

// ============================================================
// HOTEL CARD RENDERER
// ============================================================

function renderHotelCard(hotel, wishlistIds = []) {
  const inWishlist = wishlistIds.includes(hotel.id);
  return `
  <div class="hotel-card" data-hotel-id="${hotel.id}">
    <div class="hotel-card-img-wrap">
      <img src="${hotel.images[0]}" alt="${hotel.name}" class="hotel-card-img" loading="lazy" onerror="this.src='https://picsum.photos/seed/fallback${hotel.id}/800/500'">
      <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist(${hotel.id}, this)" title="${inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}">♥</button>
      <div class="hotel-card-badges">
        ${hotel.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
        ${hotel.category === 'resort' ? '<span class="badge badge-resort">Resort</span>' : ''}
        ${hotel.category === 'boutique' ? '<span class="badge badge-boutique">Boutique</span>' : ''}
      </div>
    </div>
    <div class="hotel-card-body">
      <div class="hotel-card-location">📍 ${hotel.location}</div>
      <h3 class="hotel-card-name"><a href="hotel-details.html?id=${hotel.id}">${hotel.name}</a></h3>
      <div class="hotel-card-rating">
        ${renderStars(hotel.rating)}
        <span class="review-count">(${hotel.reviewCount} reviews)</span>
        <span class="stars-label">${'★'.repeat(hotel.stars)}</span>
      </div>
      <p class="hotel-card-desc">${hotel.shortDesc}</p>
      <div class="hotel-card-amenities">
        ${hotel.amenities.slice(0, 5).map(a => renderAmenityBadge(a, false)).join('')}
        ${hotel.amenities.length > 5 ? `<span class="amenity-more">+${hotel.amenities.length - 5}</span>` : ''}
      </div>
      <div class="hotel-card-footer">
        <div class="hotel-card-price">
          <span class="price-from">From</span>
          <span class="price-amount">${formatCurrency(hotel.priceFrom)}</span>
          <span class="price-night">/ night</span>
        </div>
        <a href="hotel-details.html?id=${hotel.id}" class="btn btn-primary btn-sm">View Details</a>
      </div>
    </div>
  </div>`;
}

// ============================================================
// WISHLIST HELPERS
// ============================================================

function getWishlistIds(userId) {
  if (!userId) return [];
  const wishlist = DB.get(DB.KEYS.WISHLIST) || {};
  return wishlist[userId] || [];
}

function toggleWishlist(hotelId, btn) {
  const user = DB.get(DB.KEYS.CURRENT_USER);
  if (!user) {
    showToast('Please login to save hotels to your wishlist.', 'warning');
    setTimeout(() => { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href); }, 800);
    return;
  }
  const wishlist = DB.get(DB.KEYS.WISHLIST) || {};
  if (!wishlist[user.id]) wishlist[user.id] = [];
  const idx = wishlist[user.id].indexOf(hotelId);
  if (idx === -1) {
    wishlist[user.id].push(hotelId);
    if (btn) { btn.classList.add('active'); btn.title = 'Remove from wishlist'; }
    showToast('Added to wishlist!', 'success');
  } else {
    wishlist[user.id].splice(idx, 1);
    if (btn) { btn.classList.remove('active'); btn.title = 'Save to wishlist'; }
    showToast('Removed from wishlist.', 'info');
  }
  DB.set(DB.KEYS.WISHLIST, wishlist);
}

// ============================================================
// PROMO CODE VALIDATOR
// ============================================================

function validatePromo(code, amount) {
  const promo = PROMO_CODES.find(p => p.code === code.toUpperCase());
  if (!promo) return { valid: false, message: 'Invalid promo code.' };
  if (amount < promo.minAmount) return { valid: false, message: `Minimum booking amount of ${formatCurrency(promo.minAmount)} required.` };
  const discount = promo.type === 'percent' ? amount * promo.discount / 100 : promo.discount;
  return { valid: true, discount, message: promo.description };
}

// ============================================================
// STATUS BADGE
// ============================================================

function statusBadge(status) {
  const map = {
    'pending': 'badge-warning',
    'confirmed': 'badge-primary',
    'checked-in': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-danger',
    'approved': 'badge-success',
    'rejected': 'badge-danger',
    'active': 'badge-success',
    'inactive': 'badge-secondary'
  };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`;
}

// ============================================================
// SEARCH FORM SETUP
// ============================================================

function initSearchForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Set min dates
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const checkInInput = form.querySelector('[name="checkIn"]') || form.querySelector('#checkIn');
  const checkOutInput = form.querySelector('[name="checkOut"]') || form.querySelector('#checkOut');
  if (checkInInput) {
    checkInInput.min = today;
    if (!checkInInput.value) checkInInput.value = addDays(today, 7);
  }
  if (checkOutInput) {
    checkOutInput.min = tomorrow;
    if (!checkOutInput.value) checkOutInput.value = addDays(today, 9);
  }
  if (checkInInput) {
    checkInInput.addEventListener('change', () => {
      if (checkOutInput && checkInInput.value >= checkOutInput.value) {
        checkOutInput.value = addDays(checkInInput.value, 1);
      }
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const params = new URLSearchParams({
      city: data.get('city') || data.get('destination') || '',
      checkIn: data.get('checkIn') || checkInInput?.value || '',
      checkOut: data.get('checkOut') || checkOutInput?.value || '',
      adults: data.get('adults') || '2',
      children: data.get('children') || '0',
      rooms: data.get('rooms') || '1'
    });
    window.location.href = 'search-results.html?' + params.toString();
  });
}
