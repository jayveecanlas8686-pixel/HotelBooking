// ============================================================
// STAYEASE - REVIEWS MODULE
// ============================================================

const Reviews = {
  getByHotel(hotelId) { return DB.findAll(DB.KEYS.REVIEWS, r => r.hotelId === parseInt(hotelId) && r.status === 'approved'); },
  getByUser(userId) { return DB.findAll(DB.KEYS.REVIEWS, r => r.userId === userId); },
  getAll() { return DB.getAll(DB.KEYS.REVIEWS); },

  add(data) {
    const review = {
      id: DB.nextId(DB.KEYS.REVIEWS),
      userId: data.userId,
      hotelId: data.hotelId,
      bookingId: data.bookingId || null,
      userName: data.userName,
      userAvatar: null,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      categories: data.categories || {},
      response: null,
      responseDate: null,
      createdAt: todayStr(),
      status: 'approved'
    };
    DB.insert(DB.KEYS.REVIEWS, review);
    return review;
  },

  edit(id, updates) {
    return DB.update(DB.KEYS.REVIEWS, id, { ...updates, updatedAt: todayStr() });
  },

  delete(id) {
    return DB.delete(DB.KEYS.REVIEWS, id);
  },

  calcAverage(hotelId) {
    const reviews = this.getByHotel(hotelId);
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }
};

// ============================================================
// REVIEWS PAGE
// ============================================================

function initReviewsPage() {
  const user = Auth.requireLogin();
  if (!user) return;
  initPage();

  const bookingId = getUrlParam('bookingId');
  const hotelId = getUrlParam('hotelId');

  // If coming from a booking to leave a review
  if (bookingId && hotelId) {
    renderAddReviewForm(user, parseInt(hotelId), bookingId);
  }

  renderUserReviews(user);
}

function renderAddReviewForm(user, hotelId, bookingId) {
  const formSection = document.getElementById('add-review-section');
  if (!formSection) return;

  const hotel = Hotels.getById(hotelId);
  if (!hotel) return;

  const existing = DB.findOne(DB.KEYS.REVIEWS, r => r.bookingId === bookingId && r.userId === user.id);

  formSection.innerHTML = `
    <div class="review-form-card">
      <div class="review-form-hotel">
        <img src="${hotel.images[0]}" alt="${hotel.name}" class="review-form-hotel-img">
        <div>
          <h4>${hotel.name}</h4>
          <p>📍 ${hotel.location}</p>
          ${bookingId ? `<p class="text-light">Booking: ${bookingId}</p>` : ''}
        </div>
      </div>
      ${existing ? `
        <div class="alert alert-info">
          You've already submitted a review for this booking. You can edit it below.
        </div>
        ${renderReviewFormHTML(hotel, bookingId, existing)}
      ` : renderReviewFormHTML(hotel, bookingId, null)}
    </div>`;

  document.getElementById('review-submit-form')?.addEventListener('submit', e => submitReview(e, user, hotelId, bookingId, existing?.id));
}

function renderReviewFormHTML(hotel, bookingId, existing) {
  return `
  <form id="review-submit-form" class="review-form">
    <div class="review-form-rating">
      <label>Overall Rating *</label>
      <div class="interactive-stars" id="interactive-stars">
        ${[1,2,3,4,5].map(i => `
          <span class="i-star ${existing && i <= existing.rating ? 'active' : ''}" data-val="${i}" onclick="setRating(${i})">★</span>
        `).join('')}
        <input type="hidden" id="review-rating" value="${existing?.rating || 0}">
        <span id="rating-label" class="rating-label">${existing ? getRatingLabel(existing.rating) : 'Click to rate'}</span>
      </div>
    </div>
    <div class="review-form-categories">
      <h4>Rate by Category</h4>
      <div class="category-ratings-grid">
        ${['location', 'cleanliness', 'service', 'value', 'facilities'].map(cat => `
          <div class="cat-rating-row">
            <label>${cat.charAt(0).toUpperCase() + cat.slice(1)}</label>
            <div class="cat-stars">
              ${[1,2,3,4,5].map(i => `<span class="cat-star ${existing?.categories?.[cat] >= i ? 'active' : ''}" data-cat="${cat}" data-val="${i}" onclick="setCatRating('${cat}', ${i})">★</span>`).join('')}
              <input type="hidden" id="cat-${cat}" value="${existing?.categories?.[cat] || 0}">
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label for="review-title">Review Title *</label>
      <input type="text" id="review-title" class="form-control" placeholder="Summarize your stay in one line" maxlength="100" value="${existing?.title || ''}">
    </div>
    <div class="form-group">
      <label for="review-comment">Your Review *</label>
      <textarea id="review-comment" class="form-control" rows="5" placeholder="Tell others about your experience... (min. 20 characters)" maxlength="1000">${existing?.comment || ''}</textarea>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">${existing ? 'Update Review' : 'Submit Review'}</button>
      <a href="my-bookings.html" class="btn btn-outline">Cancel</a>
    </div>
  </form>`;
}

function setRating(val) {
  document.getElementById('review-rating').value = val;
  document.querySelectorAll('.i-star').forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
  const labelEl = document.getElementById('rating-label');
  if (labelEl) labelEl.textContent = getRatingLabel(val);
}

function setCatRating(cat, val) {
  document.getElementById('cat-' + cat).value = val;
  document.querySelectorAll(`.cat-star[data-cat="${cat}"]`).forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
}

function getRatingLabel(val) {
  return ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][val] || 'Click to rate';
}

function submitReview(e, user, hotelId, bookingId, existingId) {
  e.preventDefault();
  const rating = parseInt(document.getElementById('review-rating').value);
  const title = document.getElementById('review-title').value.trim();
  const comment = document.getElementById('review-comment').value.trim();

  if (!rating) { showToast('Please select a rating.', 'warning'); return; }
  if (!title) { showToast('Please enter a review title.', 'warning'); return; }
  if (comment.length < 20) { showToast('Review must be at least 20 characters.', 'warning'); return; }

  const categories = {};
  ['location', 'cleanliness', 'service', 'value', 'facilities'].forEach(cat => {
    const val = parseInt(document.getElementById('cat-' + cat)?.value || 0);
    if (val) categories[cat] = val;
  });

  if (existingId) {
    Reviews.edit(existingId, { rating, title, comment, categories });
    showToast('Review updated successfully!', 'success');
  } else {
    Reviews.add({ userId: user.id, hotelId: parseInt(hotelId), bookingId, userName: user.name, rating, title, comment, categories });
    showToast('Review submitted! Thank you!', 'success');
  }

  setTimeout(() => { window.location.href = 'my-bookings.html'; }, 800);
}

function renderUserReviews(user) {
  const container = document.getElementById('my-reviews-list');
  if (!container) return;

  const reviews = Reviews.getByUser(user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById('reviews-count') && (document.getElementById('reviews-count').textContent = reviews.length + ' reviews');

  if (!reviews.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <h3>No reviews yet</h3>
        <p>After completing a stay, you can leave a review to help other travellers.</p>
        <a href="my-bookings.html" class="btn btn-primary">My Bookings</a>
      </div>`;
    return;
  }

  container.innerHTML = reviews.map(r => {
    const hotel = Hotels.getById(r.hotelId);
    return `
    <div class="my-review-card">
      <div class="my-review-hotel">
        ${hotel ? `<img src="${hotel.images[0]}" alt="${hotel.name}" class="my-review-hotel-img">` : ''}
        <div>
          <div class="my-review-hotel-name">${hotel?.name || 'Hotel'}</div>
          <div class="my-review-hotel-loc">${hotel?.location || ''}</div>
        </div>
      </div>
      <div class="my-review-body">
        <div class="my-review-header">
          ${renderStars(r.rating)}
          <span class="my-review-date">${formatDateShort(r.createdAt)}</span>
          ${statusBadge(r.status)}
        </div>
        <h4 class="my-review-title">"${r.title}"</h4>
        <p class="my-review-comment">${r.comment}</p>
        ${r.response ? `<div class="review-response"><strong>Hotel Response:</strong> ${r.response}</div>` : ''}
      </div>
      <div class="my-review-actions">
        <button class="btn btn-outline btn-sm" onclick="editReviewPrompt(${r.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteReviewPrompt(${r.id})">🗑️ Delete</button>
      </div>
    </div>`;
  }).join('');
}

function editReviewPrompt(reviewId) {
  const review = DB.findOne(DB.KEYS.REVIEWS, r => r.id === reviewId);
  if (!review) return;
  window.location.href = `reviews.html?hotelId=${review.hotelId}&bookingId=${review.bookingId || ''}`;
}

function deleteReviewPrompt(reviewId) {
  showModal('Delete Review', '<p>Are you sure you want to delete this review?</p>',
    [
      { label: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
      { label: 'Delete', class: 'btn btn-danger', onclick: `confirmDeleteReview(${reviewId})` }
    ]
  );
}

function confirmDeleteReview(reviewId) {
  Reviews.delete(reviewId);
  closeModal();
  showToast('Review deleted.', 'success');
  setTimeout(() => { window.location.reload(); }, 600);
}
