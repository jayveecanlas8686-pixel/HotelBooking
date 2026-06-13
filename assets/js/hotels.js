// ============================================================
// STAYEASE - HOTELS MODULE
// ============================================================

const Hotels = {
  getAll() { return DB.getAll(DB.KEYS.HOTELS); },
  getById(id) { return DB.findOne(DB.KEYS.HOTELS, h => h.id === parseInt(id)); },
  getFeatured() { return this.getAll().filter(h => h.featured && h.status === 'approved'); },
  getApproved() { return this.getAll().filter(h => h.status === 'approved'); },
  getRooms(hotelId) { return DB.findAll(DB.KEYS.ROOMS, r => r.hotelId === parseInt(hotelId)); },
  getRoomById(id) { return DB.findOne(DB.KEYS.ROOMS, r => r.id === parseInt(id)); },

  search(params = {}) {
    let hotels = this.getApproved();
    const { city, destination, category, stars, minPrice, maxPrice, amenities, sortBy } = params;

    const query = (city || destination || '').toLowerCase().trim();
    if (query) {
      hotels = hotels.filter(h =>
        h.city.toLowerCase().includes(query) ||
        h.country.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query) ||
        h.name.toLowerCase().includes(query)
      );
    }
    if (category && category !== 'all') {
      hotels = hotels.filter(h => h.category === category);
    }
    if (stars) {
      const starsArr = Array.isArray(stars) ? stars.map(Number) : [parseInt(stars)];
      hotels = hotels.filter(h => starsArr.includes(h.stars));
    }
    if (minPrice) {
      hotels = hotels.filter(h => h.priceFrom >= parseInt(minPrice));
    }
    if (maxPrice) {
      hotels = hotels.filter(h => h.priceFrom <= parseInt(maxPrice));
    }
    if (amenities && amenities.length) {
      const amenArr = Array.isArray(amenities) ? amenities : [amenities];
      hotels = hotels.filter(h => amenArr.every(a => h.amenities.includes(a)));
    }

    return this.sort(hotels, sortBy || 'popular');
  },

  sort(hotels, sortBy) {
    const arr = [...hotels];
    switch (sortBy) {
      case 'price-asc': return arr.sort((a, b) => a.priceFrom - b.priceFrom);
      case 'price-desc': return arr.sort((a, b) => b.priceFrom - a.priceFrom);
      case 'rating': return arr.sort((a, b) => b.rating - a.rating);
      case 'reviews': return arr.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'newest': return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default: return arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    }
  },

  getAverageRating(hotelId) {
    const reviews = DB.findAll(DB.KEYS.REVIEWS, r => r.hotelId === parseInt(hotelId) && r.status === 'approved');
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }
};

// ============================================================
// SEARCH RESULTS PAGE
// ============================================================

let searchPage = 1;
const SEARCH_PER_PAGE = 6;
let filteredHotels = [];

function initSearchResultsPage() {
  const currentUser = initPage();
  const params = new URLSearchParams(window.location.search);

  // Populate search bar
  const searchBar = document.getElementById('search-destination');
  if (searchBar) searchBar.value = params.get('city') || params.get('destination') || '';

  const checkInEl = document.getElementById('sr-checkin');
  const checkOutEl = document.getElementById('sr-checkout');
  if (checkInEl) checkInEl.value = params.get('checkIn') || addDays(todayStr(), 7);
  if (checkOutEl) checkOutEl.value = params.get('checkOut') || addDays(todayStr(), 9);

  const today = todayStr();
  if (checkInEl) checkInEl.min = today;
  if (checkOutEl) checkOutEl.min = today;

  runSearch();

  // Filter events
  document.querySelectorAll('.filter-input').forEach(el => {
    el.addEventListener('change', () => { searchPage = 1; runSearch(); });
  });
  document.getElementById('sort-select')?.addEventListener('change', () => { searchPage = 1; runSearch(); });
  document.getElementById('search-btn')?.addEventListener('click', () => { searchPage = 1; runSearch(); });
  document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
}

function runSearch() {
  const destination = document.getElementById('search-destination')?.value || '';
  const sortBy = document.getElementById('sort-select')?.value || 'popular';
  const minPrice = document.getElementById('filter-min-price')?.value || '';
  const maxPrice = document.getElementById('filter-max-price')?.value || '';
  const stars = [...document.querySelectorAll('.filter-stars:checked')].map(el => el.value);
  const amenities = [...document.querySelectorAll('.filter-amenity:checked')].map(el => el.value);
  const category = document.getElementById('filter-category')?.value || 'all';
  const urlParams = new URLSearchParams(window.location.search);

  filteredHotels = Hotels.search({
    city: destination || urlParams.get('city') || urlParams.get('destination') || '',
    category,
    stars,
    minPrice,
    maxPrice,
    amenities,
    sortBy
  });

  renderSearchResults();
}

function renderSearchResults() {
  const container = document.getElementById('results-container');
  const countEl = document.getElementById('results-count');
  if (!container) return;

  const start = (searchPage - 1) * SEARCH_PER_PAGE;
  const end = start + SEARCH_PER_PAGE;
  const paged = filteredHotels.slice(start, end);

  if (countEl) countEl.textContent = filteredHotels.length + ' properties found';

  if (!filteredHotels.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No properties found</h3>
        <p>Try adjusting your search filters or destination.</p>
        <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
      </div>`;
    document.getElementById('pagination-container').innerHTML = '';
    return;
  }

  const user = DB.get(DB.KEYS.CURRENT_USER);
  const wishlistIds = getWishlistIds(user?.id);

  container.innerHTML = paged.map(h => renderHotelCard(h, wishlistIds)).join('');

  const pgContainer = document.getElementById('pagination-container');
  if (pgContainer) {
    renderPagination(pgContainer, filteredHotels.length, searchPage, SEARCH_PER_PAGE, 'goToSearchPage');
  }
}

function goToSearchPage(page) {
  searchPage = page;
  renderSearchResults();
  window.scrollTo({ top: document.getElementById('results-container')?.offsetTop - 80, behavior: 'smooth' });
}

function clearFilters() {
  document.querySelectorAll('.filter-input, .filter-stars, .filter-amenity').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
    else el.value = '';
  });
  document.getElementById('filter-category') && (document.getElementById('filter-category').value = 'all');
  document.getElementById('sort-select') && (document.getElementById('sort-select').value = 'popular');
  searchPage = 1;
  runSearch();
}

// ============================================================
// HOTELS LISTING PAGE
// ============================================================

let hotelsPage = 1;
const HOTELS_PER_PAGE = 9;
let allHotels = [];

function initHotelsPage() {
  initPage();
  allHotels = Hotels.getApproved();
  const user = DB.get(DB.KEYS.CURRENT_USER);
  const wishlistIds = getWishlistIds(user?.id);
  renderHotelsGrid(wishlistIds);

  document.getElementById('hotels-sort')?.addEventListener('change', () => {
    allHotels = Hotels.sort(allHotels, document.getElementById('hotels-sort').value);
    hotelsPage = 1;
    renderHotelsGrid(wishlistIds);
  });

  document.querySelectorAll('.hotels-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hotels-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      allHotels = cat === 'all' ? Hotels.getApproved() : Hotels.getApproved().filter(h => h.category === cat);
      hotelsPage = 1;
      renderHotelsGrid(wishlistIds);
    });
  });
}

function renderHotelsGrid(wishlistIds) {
  const container = document.getElementById('hotels-grid');
  const countEl = document.getElementById('hotels-count');
  if (!container) return;

  const start = (hotelsPage - 1) * HOTELS_PER_PAGE;
  const paged = allHotels.slice(start, start + HOTELS_PER_PAGE);

  if (countEl) countEl.textContent = `Showing ${Math.min(start + 1, allHotels.length)}–${Math.min(start + HOTELS_PER_PAGE, allHotels.length)} of ${allHotels.length}`;
  container.innerHTML = paged.map(h => renderHotelCard(h, wishlistIds)).join('');

  const pgContainer = document.getElementById('hotels-pagination');
  if (pgContainer) renderPagination(pgContainer, allHotels.length, hotelsPage, HOTELS_PER_PAGE, 'goToHotelsPage');
}

function goToHotelsPage(page) {
  hotelsPage = page;
  const user = DB.get(DB.KEYS.CURRENT_USER);
  renderHotelsGrid(getWishlistIds(user?.id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// HOTEL DETAILS PAGE
// ============================================================

function initHotelDetailsPage() {
  const currentUser = initPage();
  const hotelId = getUrlParam('id');
  if (!hotelId) { window.location.href = 'hotels.html'; return; }

  const hotel = Hotels.getById(hotelId);
  if (!hotel) {
    document.getElementById('hotel-detail-content').innerHTML = `<div class="empty-state"><h3>Hotel not found</h3><a href="hotels.html" class="btn btn-primary">Back to Hotels</a></div>`;
    return;
  }

  const rooms = Hotels.getRooms(hotelId);
  const reviews = DB.findAll(DB.KEYS.REVIEWS, r => r.hotelId === hotel.id && r.status === 'approved');
  const wishlistIds = getWishlistIds(currentUser?.id);

  document.title = hotel.name + ' - StayEase';

  renderHotelDetailHero(hotel, wishlistIds);
  renderHotelDetailInfo(hotel, rooms, reviews);
  renderHotelRooms(hotel, rooms);
  renderHotelReviews(hotel, reviews);
  renderRelatedHotels(hotel, wishlistIds);

  // Pre-fill dates from URL
  const checkIn = getUrlParam('checkIn') || addDays(todayStr(), 7);
  const checkOut = getUrlParam('checkOut') || addDays(todayStr(), 9);
  const checkInEl = document.getElementById('detail-checkin');
  const checkOutEl = document.getElementById('detail-checkout');
  if (checkInEl) { checkInEl.value = checkIn; checkInEl.min = todayStr(); }
  if (checkOutEl) { checkOutEl.value = checkOut; checkOutEl.min = addDays(todayStr(), 1); }
  if (checkInEl) checkInEl.addEventListener('change', () => { if (checkOutEl && checkInEl.value >= checkOutEl.value) checkOutEl.value = addDays(checkInEl.value, 1); });
}

function renderHotelDetailHero(hotel, wishlistIds) {
  const galleryEl = document.getElementById('hotel-gallery');
  if (!galleryEl) return;
  const inWishlist = wishlistIds.includes(hotel.id);

  galleryEl.innerHTML = `
    <div class="gallery-main">
      <img src="${hotel.images[0]}" alt="${hotel.name}" class="gallery-main-img" id="gallery-main-img">
      <button class="gallery-wishlist-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist(${hotel.id}, this)" title="Save to wishlist">♥</button>
    </div>
    <div class="gallery-thumbs">
      ${hotel.images.map((img, i) => `<img src="${img}" alt="${hotel.name} ${i+1}" class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchGalleryImage(this, '${img}')">`).join('')}
    </div>`;
}

function switchGalleryImage(thumb, src) {
  document.getElementById('gallery-main-img').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function renderHotelDetailInfo(hotel, rooms, reviews) {
  const infoEl = document.getElementById('hotel-info');
  if (!infoEl) return;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : hotel.rating;
  const priceFrom = rooms.length ? Math.min(...rooms.map(r => r.price)) : hotel.priceFrom;

  infoEl.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="detail-location">📍 ${hotel.location}</div>
        <h1 class="detail-name">${hotel.name}</h1>
        <div class="detail-meta">
          ${renderStars(parseFloat(avgRating))}
          <span class="review-count">${reviews.length} reviews</span>
          <span class="stars-badge">${'★'.repeat(hotel.stars)} ${hotel.stars}-Star ${hotel.category.charAt(0).toUpperCase() + hotel.category.slice(1)}</span>
        </div>
      </div>
      <div class="detail-header-right">
        <div class="detail-price-box">
          <div class="detail-price-from">From</div>
          <div class="detail-price-amount">${formatCurrency(priceFrom)}</div>
          <div class="detail-price-night">per night</div>
          <a href="#rooms-section" class="btn btn-primary btn-lg">Book Now</a>
        </div>
      </div>
    </div>
    <div class="detail-address">🏠 ${hotel.address} · 📞 ${hotel.phone || 'Contact hotel'}</div>
    <div class="detail-tags">
      ${hotel.tags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>
    <div class="detail-description">
      <h3>About ${hotel.name}</h3>
      <p>${hotel.description}</p>
    </div>
    <div class="detail-amenities">
      <h3>What's Included</h3>
      <div class="amenities-grid">
        ${hotel.amenities.map(a => renderAmenityBadge(a)).join('')}
      </div>
    </div>
    <div class="detail-policies">
      <h3>Hotel Policies</h3>
      <div class="policies-grid">
        <div class="policy-item"><span class="policy-icon">🕐</span><div><strong>Check-in</strong><p>${hotel.policies.checkIn}</p></div></div>
        <div class="policy-item"><span class="policy-icon">🕐</span><div><strong>Check-out</strong><p>${hotel.policies.checkOut}</p></div></div>
        <div class="policy-item"><span class="policy-icon">🚫</span><div><strong>Cancellation</strong><p>${hotel.policies.cancellation}</p></div></div>
        <div class="policy-item"><span class="policy-icon">🐾</span><div><strong>Pets</strong><p>${hotel.policies.pets}</p></div></div>
        <div class="policy-item"><span class="policy-icon">🚬</span><div><strong>Smoking</strong><p>${hotel.policies.smoking}</p></div></div>
      </div>
    </div>
    <div class="detail-map">
      <h3>Location</h3>
      <div class="map-placeholder">
        <div class="map-pin">📍</div>
        <div class="map-label">${hotel.name}</div>
        <div class="map-sublabel">${hotel.address}</div>
        <div class="map-note">Interactive map available in full version</div>
      </div>
    </div>`;
}

function renderHotelRooms(hotel, rooms) {
  const el = document.getElementById('rooms-section');
  if (!el) return;

  const checkIn = document.getElementById('detail-checkin')?.value || addDays(todayStr(), 7);
  const checkOut = document.getElementById('detail-checkout')?.value || addDays(todayStr(), 9);
  const adults = document.getElementById('detail-adults')?.value || 2;

  el.innerHTML = `
    <div class="rooms-header">
      <h3>Available Rooms</h3>
      <div class="rooms-date-picker">
        <div class="date-field">
          <label>Check-in</label>
          <input type="date" id="detail-checkin" value="${checkIn}" min="${todayStr()}" onchange="refreshRoomAvailability()">
        </div>
        <div class="date-field">
          <label>Check-out</label>
          <input type="date" id="detail-checkout" value="${checkOut}" min="${addDays(todayStr(),1)}" onchange="refreshRoomAvailability()">
        </div>
        <div class="date-field">
          <label>Adults</label>
          <select id="detail-adults" onchange="refreshRoomAvailability()">
            ${[1,2,3,4,5,6].map(n => `<option ${n == adults ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="refreshRoomAvailability()">Check Availability</button>
      </div>
    </div>
    <div id="rooms-list">
      ${rooms.map(r => renderRoomCard(r, hotel.id, checkIn, checkOut)).join('')}
    </div>`;
}

function refreshRoomAvailability() {
  const hotelId = getUrlParam('id');
  const hotel = Hotels.getById(hotelId);
  const rooms = Hotels.getRooms(hotelId);
  const checkIn = document.getElementById('detail-checkin')?.value;
  const checkOut = document.getElementById('detail-checkout')?.value;
  const list = document.getElementById('rooms-list');
  if (list) list.innerHTML = rooms.map(r => renderRoomCard(r, parseInt(hotelId), checkIn, checkOut)).join('');
}

function renderRoomCard(room, hotelId, checkIn, checkOut) {
  const nights = (checkIn && checkOut) ? calcNights(checkIn, checkOut) : 1;
  const total = room.price * nights;
  const available = room.availableCount > 0;
  const discount = room.originalPrice > room.price ? Math.round((1 - room.price/room.originalPrice)*100) : 0;

  return `
  <div class="room-card ${!available ? 'room-unavailable' : ''}">
    <div class="room-card-img">
      <img src="${room.images[0]}" alt="${room.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/roomfb${room.id}/700/450'">
      ${discount ? `<span class="room-discount-badge">-${discount}%</span>` : ''}
    </div>
    <div class="room-card-info">
      <h4 class="room-name">${room.name}</h4>
      <div class="room-meta">
        <span>🛏️ ${room.bedType}</span>
        <span>📐 ${room.size} m²</span>
        <span>👥 Up to ${room.capacity.adults} adults${room.capacity.children ? '+' + room.capacity.children + ' children' : ''}</span>
      </div>
      <p class="room-desc">${room.description}</p>
      <div class="room-amenities">
        ${room.amenities.slice(0,6).map(a => `<span class="room-amenity-tag">${AMENITY_MAP[a]?.icon || '✓'} ${AMENITY_MAP[a]?.label || a}</span>`).join('')}
      </div>
    </div>
    <div class="room-card-booking">
      <div class="room-availability">
        ${available ? `<span class="avail-good">✓ ${room.availableCount} left</span>` : '<span class="avail-none">✗ Sold Out</span>'}
      </div>
      <div class="room-price-block">
        ${discount ? `<div class="room-orig-price">${formatCurrency(room.originalPrice)}/night</div>` : ''}
        <div class="room-price">${formatCurrency(room.price)}<span>/night</span></div>
        ${nights > 1 ? `<div class="room-total">${formatCurrency(total)} total (${nights} nights)</div>` : ''}
      </div>
      ${available
        ? `<a href="booking.html?hotelId=${hotelId}&roomId=${room.id}&checkIn=${checkIn||''}&checkOut=${checkOut||''}" class="btn btn-primary">Book This Room</a>`
        : `<button class="btn btn-secondary" disabled>Not Available</button>`}
    </div>
  </div>`;
}

function renderHotelReviews(hotel, reviews) {
  const el = document.getElementById('hotel-reviews');
  if (!el) return;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const cats = ['location', 'cleanliness', 'service', 'value', 'facilities'];
  const catAvgs = cats.map(c => {
    const vals = reviews.filter(r => r.categories && r.categories[c]).map(r => r.categories[c]);
    return { name: c, avg: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0 };
  });

  el.innerHTML = `
    <h3>Guest Reviews <span class="review-badge">${renderStars(avg)} ${reviews.length} reviews</span></h3>
    <div class="reviews-summary">
      <div class="reviews-score-big">
        <div class="big-score">${avg.toFixed(1)}</div>
        <div class="big-score-label">Exceptional</div>
        <div class="big-score-count">${reviews.length} verified reviews</div>
      </div>
      <div class="reviews-categories">
        ${catAvgs.map(c => `
          <div class="review-cat">
            <div class="review-cat-label">${c.name.charAt(0).toUpperCase() + c.name.slice(1)}</div>
            <div class="review-cat-bar"><div class="review-cat-fill" style="width:${c.avg*20}%"></div></div>
            <div class="review-cat-score">${c.avg.toFixed(1)}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="reviews-list">
      ${reviews.length ? reviews.map(r => renderReviewCard(r)).join('') : '<p class="no-reviews">No reviews yet. Be the first to review!</p>'}
    </div>`;
}

function renderReviewCard(review) {
  const user = DB.findOne(DB.KEYS.USERS, u => u.id === review.userId);
  const initials = review.userName ? review.userName.charAt(0).toUpperCase() : '?';
  return `
  <div class="review-card">
    <div class="review-header">
      <div class="reviewer-avatar">${initials}</div>
      <div class="reviewer-info">
        <div class="reviewer-name">${review.userName || 'Anonymous'}</div>
        <div class="reviewer-date">${formatDateShort(review.createdAt)}</div>
      </div>
      <div class="review-rating">${renderStars(review.rating)}</div>
    </div>
    <h4 class="review-title">"${review.title}"</h4>
    <p class="review-comment">${review.comment}</p>
    ${review.response ? `
      <div class="review-response">
        <div class="response-header">🏨 Response from ${Hotels.getById(review.hotelId)?.name || 'Hotel'}</div>
        <p>${review.response}</p>
      </div>` : ''}
  </div>`;
}

function renderRelatedHotels(hotel, wishlistIds) {
  const el = document.getElementById('related-hotels');
  if (!el) return;
  const related = Hotels.getApproved()
    .filter(h => h.id !== hotel.id && (h.city === hotel.city || h.category === hotel.category))
    .slice(0, 3);
  if (!related.length) { el.style.display = 'none'; return; }
  el.innerHTML = `<h3>You May Also Like</h3><div class="related-grid">${related.map(h => renderHotelCard(h, wishlistIds)).join('')}</div>`;
}
