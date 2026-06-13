// ============================================================
// STAYEASE - BOOKING MODULE
// ============================================================

const Booking = {
  create(data) {
    const ref = generateBookingRef();
    const booking = {
      id: ref,
      userId: data.userId,
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: calcNights(data.checkIn, data.checkOut),
      guests: data.guests,
      guestInfo: data.guestInfo,
      addOns: data.addOns || [],
      promoCode: data.promoCode || null,
      promoDiscount: data.promoDiscount || 0,
      subtotal: data.subtotal,
      addOnsTotal: data.addOnsTotal,
      discount: data.discount,
      taxes: data.taxes,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed',
      createdAt: todayStr(),
      updatedAt: todayStr()
    };
    DB.insert(DB.KEYS.BOOKINGS, booking);

    // Reduce room availability
    const room = Hotels.getRoomById(data.roomId);
    if (room && room.availableCount > 0) {
      DB.update(DB.KEYS.ROOMS, room.id, { availableCount: room.availableCount - 1 });
    }
    return booking;
  },

  cancel(bookingId) {
    const booking = this.getById(bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };
    if (booking.status === 'cancelled') return { success: false, message: 'Already cancelled.' };
    if (booking.status === 'completed') return { success: false, message: 'Cannot cancel a completed booking.' };

    DB.update(DB.KEYS.BOOKINGS, bookingId, { status: 'cancelled', updatedAt: todayStr() });

    // Restore room availability
    const room = Hotels.getRoomById(booking.roomId);
    if (room) {
      DB.update(DB.KEYS.ROOMS, room.id, { availableCount: Math.min(room.availableCount + 1, room.totalCount) });
    }
    return { success: true };
  },

  getById(id) { return DB.findOne(DB.KEYS.BOOKINGS, b => b.id === id); },
  getByUser(userId) { return DB.findAll(DB.KEYS.BOOKINGS, b => b.userId === userId); },
  getByHotel(hotelId) { return DB.findAll(DB.KEYS.BOOKINGS, b => b.hotelId === parseInt(hotelId)); },
  getAll() { return DB.getAll(DB.KEYS.BOOKINGS); },

  updateStatus(bookingId, status) {
    return DB.update(DB.KEYS.BOOKINGS, bookingId, { status, updatedAt: todayStr() });
  },

  calcTotal(pricePerNight, nights, addOns, promoCode) {
    const roomTotal = pricePerNight * nights;
    const addOnsTotal = addOns.reduce((s, a) => s + a.price, 0);
    const subtotal = roomTotal + addOnsTotal;
    let discount = 0;
    let validPromo = null;
    if (promoCode) {
      const result = validatePromo(promoCode, subtotal);
      if (result.valid) { discount = result.discount; validPromo = promoCode; }
    }
    const taxes = (subtotal - discount) * 0.12;
    const total = subtotal - discount + taxes;
    return { roomTotal, addOnsTotal, subtotal, discount, taxes, total: Math.round(total * 100) / 100, validPromo };
  }
};

// ============================================================
// BOOKING PAGE
// ============================================================

const ADD_ONS_LIST = [
  { id: 'breakfast', name: 'Breakfast Included', desc: 'Daily breakfast for all guests', price: 30, icon: '🍳' },
  { id: 'airport', name: 'Airport Transfer', desc: 'Round-trip airport pickup and drop', price: 50, icon: '✈️' },
  { id: 'extrabed', name: 'Extra Bed', desc: 'Comfortable additional sleeping bed', price: 25, icon: '🛏️' },
  { id: 'latecheckout', name: 'Late Check-out', desc: 'Check-out until 4:00 PM', price: 40, icon: '🕐' },
  { id: 'spa', name: 'Spa Package', desc: '60-minute couple massage per day', price: 80, icon: '💆' }
];

let bookingState = {
  hotel: null, room: null, checkIn: '', checkOut: '', nights: 1,
  adults: 2, children: 0, rooms: 1,
  addOns: [], promoCode: '', promoDiscount: 0,
  paymentMethod: 'credit_card'
};

function initBookingPage() {
  const user = Auth.requireLogin();
  if (!user) return;
  initPage();

  const hotelId = getUrlParam('hotelId');
  const roomId = getUrlParam('roomId');

  bookingState.hotel = Hotels.getById(hotelId);
  bookingState.room = Hotels.getRoomById(roomId);
  if (!bookingState.hotel || !bookingState.room) {
    showToast('Invalid booking parameters.', 'error');
    setTimeout(() => { window.location.href = 'hotels.html'; }, 1000);
    return;
  }

  bookingState.checkIn = getUrlParam('checkIn') || addDays(todayStr(), 7);
  bookingState.checkOut = getUrlParam('checkOut') || addDays(todayStr(), 9);
  bookingState.nights = calcNights(bookingState.checkIn, bookingState.checkOut);

  renderBookingHotelSummary();
  renderAddOns();
  updatePriceBreakdown();

  // Date inputs
  const ciEl = document.getElementById('bk-checkin');
  const coEl = document.getElementById('bk-checkout');
  if (ciEl) { ciEl.value = bookingState.checkIn; ciEl.min = todayStr(); }
  if (coEl) { coEl.value = bookingState.checkOut; coEl.min = addDays(todayStr(), 1); }
  if (ciEl) ciEl.addEventListener('change', () => {
    bookingState.checkIn = ciEl.value;
    if (coEl && ciEl.value >= coEl.value) { coEl.value = addDays(ciEl.value, 1); bookingState.checkOut = coEl.value; }
    bookingState.nights = calcNights(bookingState.checkIn, bookingState.checkOut);
    updatePriceBreakdown();
  });
  if (coEl) coEl.addEventListener('change', () => {
    bookingState.checkOut = coEl.value;
    bookingState.nights = calcNights(bookingState.checkIn, bookingState.checkOut);
    updatePriceBreakdown();
  });

  // Guest selects
  document.getElementById('bk-adults')?.addEventListener('change', e => { bookingState.adults = parseInt(e.target.value); });
  document.getElementById('bk-children')?.addEventListener('change', e => { bookingState.children = parseInt(e.target.value); });

  // Payment method
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bookingState.paymentMethod = btn.dataset.method;
      document.getElementById('bk-payment-method').value = btn.dataset.method;
    });
  });

  // Promo code
  document.getElementById('apply-promo')?.addEventListener('click', applyPromoCode);
  document.getElementById('bk-promo')?.addEventListener('keydown', e => { if (e.key === 'Enter') applyPromoCode(); });

  // Submit booking
  document.getElementById('booking-form')?.addEventListener('submit', submitBooking);
}

function renderBookingHotelSummary() {
  const el = document.getElementById('booking-hotel-summary');
  if (!el) return;
  const { hotel, room, checkIn, checkOut, nights } = bookingState;

  el.innerHTML = `
    <div class="booking-hotel-img-wrap">
      <img src="${hotel.images[0]}" alt="${hotel.name}" class="booking-hotel-img">
    </div>
    <div class="booking-hotel-info">
      <div class="booking-hotel-name">${hotel.name}</div>
      <div class="booking-hotel-loc">📍 ${hotel.location}</div>
      <div class="booking-hotel-stars">${'★'.repeat(hotel.stars)}</div>
      <div class="booking-room-type">🛏️ ${room.name} · ${room.bedType} · ${room.size}m²</div>
      <div class="booking-dates">
        <div class="bk-date-item"><span>Check-in</span><strong>${formatDate(checkIn)}</strong></div>
        <div class="bk-date-arrow">→</div>
        <div class="bk-date-item"><span>Check-out</span><strong>${formatDate(checkOut)}</strong></div>
      </div>
      <div class="booking-nights-badge">${nights} night${nights > 1 ? 's' : ''}</div>
    </div>`;
}

function renderAddOns() {
  const el = document.getElementById('addons-list');
  if (!el) return;
  el.innerHTML = ADD_ONS_LIST.map(addon => `
    <label class="addon-item">
      <input type="checkbox" class="addon-checkbox" value="${addon.id}" data-price="${addon.price}" onchange="toggleAddOn('${addon.id}', ${addon.price}, this.checked)">
      <div class="addon-icon">${addon.icon}</div>
      <div class="addon-info">
        <div class="addon-name">${addon.name}</div>
        <div class="addon-desc">${addon.desc}</div>
      </div>
      <div class="addon-price">+${formatCurrency(addon.price)}/night</div>
    </label>`).join('');
}

function toggleAddOn(id, price, checked) {
  if (checked) {
    const addon = ADD_ONS_LIST.find(a => a.id === id);
    bookingState.addOns.push({ id, name: addon.name, price });
  } else {
    bookingState.addOns = bookingState.addOns.filter(a => a.id !== id);
  }
  updatePriceBreakdown();
}

function applyPromoCode() {
  const code = document.getElementById('bk-promo')?.value.trim();
  const feedbackEl = document.getElementById('promo-feedback');
  if (!code) return;

  const subtotal = bookingState.room.price * bookingState.nights + bookingState.addOns.reduce((s, a) => s + a.price, 0);
  const result = validatePromo(code, subtotal);

  if (feedbackEl) {
    feedbackEl.textContent = result.message;
    feedbackEl.className = 'promo-feedback ' + (result.valid ? 'promo-valid' : 'promo-invalid');
  }

  if (result.valid) {
    bookingState.promoCode = code.toUpperCase();
    bookingState.promoDiscount = result.discount;
  } else {
    bookingState.promoCode = '';
    bookingState.promoDiscount = 0;
  }
  updatePriceBreakdown();
}

function updatePriceBreakdown() {
  if (!bookingState.room) return;
  const { room, nights, addOns, promoDiscount } = bookingState;
  const roomTotal = room.price * nights;
  const addOnsTotal = addOns.reduce((s, a) => s + a.price * nights, 0);
  const subtotal = roomTotal + addOnsTotal;
  const discount = promoDiscount;
  const taxes = (subtotal - discount) * 0.12;
  const total = subtotal - discount + taxes;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('price-room-rate', formatCurrency(room.price) + ' × ' + nights + ' night' + (nights > 1 ? 's' : ''));
  set('price-room-total', formatCurrency(roomTotal));
  set('price-addons', addOnsTotal > 0 ? formatCurrency(addOnsTotal) : 'None');
  set('price-discount', discount > 0 ? '-' + formatCurrency(discount) : '$0.00');
  set('price-taxes', formatCurrency(taxes));
  set('price-total', formatCurrency(total));
  set('price-total-confirm', formatCurrency(total));

  bookingState._total = total;
  bookingState._taxes = taxes;
  bookingState._subtotal = subtotal;
  bookingState._addOnsTotal = addOnsTotal;
  bookingState._roomTotal = roomTotal;
}

function submitBooking(e) {
  e.preventDefault();
  clearFormErrors();
  const form = e.target;

  const firstName = form.querySelector('#bk-first-name')?.value.trim();
  const lastName = form.querySelector('#bk-last-name')?.value.trim();
  const email = form.querySelector('#bk-email')?.value.trim();
  const phone = form.querySelector('#bk-phone')?.value.trim();
  const specialRequests = form.querySelector('#bk-requests')?.value.trim();

  let valid = true;
  if (!firstName) { showFieldError('bk-first-name', 'First name is required.'); valid = false; }
  if (!lastName) { showFieldError('bk-last-name', 'Last name is required.'); valid = false; }
  if (!email) { showFieldError('bk-email', 'Email is required.'); valid = false; }
  if (!bookingState.checkIn || !bookingState.checkOut) { showToast('Please select check-in and check-out dates.', 'warning'); valid = false; }
  if (!valid) return;

  const user = Auth.getCurrentUser();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing...';

  setTimeout(() => {
    const bookingData = {
      userId: user.id,
      hotelId: bookingState.hotel.id,
      roomId: bookingState.room.id,
      checkIn: bookingState.checkIn,
      checkOut: bookingState.checkOut,
      guests: { adults: bookingState.adults, children: bookingState.children },
      guestInfo: { firstName, lastName, email, phone, specialRequests },
      addOns: bookingState.addOns,
      promoCode: bookingState.promoCode,
      promoDiscount: bookingState.promoDiscount,
      roomTotal: bookingState._roomTotal,
      addOnsTotal: bookingState._addOnsTotal,
      subtotal: bookingState._subtotal,
      discount: bookingState.promoDiscount,
      taxes: bookingState._taxes,
      totalAmount: bookingState._total,
      paymentMethod: bookingState.paymentMethod
    };

    const booking = Booking.create(bookingData);
    showToast('Booking confirmed! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'booking-confirmation.html?id=' + booking.id;
    }, 800);
  }, 1200);
}

// ============================================================
// BOOKING CONFIRMATION PAGE
// ============================================================

function initBookingConfirmationPage() {
  initPage();
  const bookingId = getUrlParam('id');
  if (!bookingId) { window.location.href = 'my-bookings.html'; return; }

  const booking = Booking.getById(bookingId);
  if (!booking) { window.location.href = 'my-bookings.html'; return; }

  const hotel = Hotels.getById(booking.hotelId);
  const room = Hotels.getRoomById(booking.roomId);
  if (!hotel || !room) return;

  document.title = 'Booking Confirmed - ' + bookingId;

  const el = document.getElementById('confirmation-content');
  if (!el) return;

  el.innerHTML = `
    <div class="confirmation-hero">
      <div class="confirmation-check">✅</div>
      <h1>Booking Confirmed!</h1>
      <p>Your reservation has been successfully placed. A confirmation email has been sent to ${booking.guestInfo.email}.</p>
      <div class="booking-ref-badge">Booking Reference: <strong>${booking.id}</strong></div>
    </div>

    <div class="confirmation-grid">
      <div class="confirmation-card">
        <h3>🏨 Hotel Details</h3>
        <div class="confirm-hotel-row">
          <img src="${hotel.images[0]}" alt="${hotel.name}" class="confirm-hotel-img">
          <div>
            <div class="confirm-hotel-name">${hotel.name}</div>
            <div class="confirm-hotel-loc">📍 ${hotel.location}</div>
            <div class="confirm-room-name">🛏️ ${room.name}</div>
            <div class="confirm-stars">${'★'.repeat(hotel.stars)}</div>
          </div>
        </div>
        <div class="confirm-dates-row">
          <div class="confirm-date-box">
            <div class="confirm-date-label">Check-in</div>
            <div class="confirm-date-val">${formatDate(booking.checkIn)}</div>
            <div class="confirm-date-time">After ${hotel.policies.checkIn}</div>
          </div>
          <div class="confirm-nights-divider">${booking.nights} night${booking.nights > 1 ? 's' : ''}</div>
          <div class="confirm-date-box">
            <div class="confirm-date-label">Check-out</div>
            <div class="confirm-date-val">${formatDate(booking.checkOut)}</div>
            <div class="confirm-date-time">Before ${hotel.policies.checkOut}</div>
          </div>
        </div>
      </div>

      <div class="confirmation-card">
        <h3>👤 Guest Information</h3>
        <div class="confirm-detail-row"><span>Name</span><strong>${booking.guestInfo.firstName} ${booking.guestInfo.lastName}</strong></div>
        <div class="confirm-detail-row"><span>Email</span><strong>${booking.guestInfo.email}</strong></div>
        <div class="confirm-detail-row"><span>Phone</span><strong>${booking.guestInfo.phone || 'Not provided'}</strong></div>
        <div class="confirm-detail-row"><span>Guests</span><strong>${booking.guests.adults} Adults${booking.guests.children ? ', ' + booking.guests.children + ' Children' : ''}</strong></div>
        ${booking.guestInfo.specialRequests ? `<div class="confirm-detail-row"><span>Requests</span><strong>${booking.guestInfo.specialRequests}</strong></div>` : ''}
      </div>

      <div class="confirmation-card">
        <h3>💳 Payment Summary</h3>
        <div class="confirm-detail-row"><span>Room (${booking.nights} nights)</span><strong>${formatCurrency(booking.roomTotal || room.price * booking.nights)}</strong></div>
        ${booking.addOns?.length ? booking.addOns.map(a => `<div class="confirm-detail-row"><span>${a.name}</span><strong>+${formatCurrency(a.price * booking.nights)}</strong></div>`).join('') : ''}
        ${booking.promoDiscount > 0 ? `<div class="confirm-detail-row discount"><span>Promo Discount (${booking.promoCode})</span><strong>-${formatCurrency(booking.promoDiscount)}</strong></div>` : ''}
        <div class="confirm-detail-row"><span>Taxes & Fees (12%)</span><strong>${formatCurrency(booking.taxes)}</strong></div>
        <div class="confirm-detail-row total-row"><span>Total Paid</span><strong>${formatCurrency(booking.totalAmount)}</strong></div>
        <div class="confirm-payment-status">
          <span class="badge badge-success">✓ Payment ${booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}</span>
          <span class="payment-method-label">${booking.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
      </div>

      <div class="confirmation-card">
        <h3>📋 Cancellation Policy</h3>
        <p>${hotel.policies.cancellation}</p>
        <div class="confirm-status-row">
          <span>Booking Status</span> ${statusBadge(booking.status)}
        </div>
      </div>
    </div>

    <div class="confirmation-actions">
      <button class="btn btn-outline" onclick="window.print()">🖨️ Print Confirmation</button>
      <a href="my-bookings.html" class="btn btn-secondary">📋 View My Bookings</a>
      <a href="hotel-details.html?id=${hotel.id}" class="btn btn-outline">🏨 Back to Hotel</a>
      <a href="index.html" class="btn btn-primary">🏠 Home</a>
    </div>`;
}

// ============================================================
// MY BOOKINGS PAGE
// ============================================================

function initMyBookingsPage() {
  const user = Auth.requireLogin();
  if (!user) return;
  initPage();

  let bookings = Booking.getByUser(user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let currentFilter = 'all';

  renderMyBookings(bookings, currentFilter);

  document.querySelectorAll('.bookings-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bookings-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      const filtered = currentFilter === 'all' ? bookings : bookings.filter(b => b.status === currentFilter);
      renderMyBookings(filtered, currentFilter);
    });
  });
}

function renderMyBookings(bookings, filter) {
  const container = document.getElementById('my-bookings-list');
  if (!container) return;

  if (!bookings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>${filter === 'all' ? "No bookings yet" : "No " + filter + " bookings"}</h3>
        <p>Explore amazing hotels and make your first reservation!</p>
        <a href="hotels.html" class="btn btn-primary">Browse Hotels</a>
      </div>`;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const hotel = Hotels.getById(b.hotelId);
    const room = Hotels.getRoomById(b.roomId);
    if (!hotel || !room) return '';
    const canCancel = ['pending', 'confirmed'].includes(b.status);
    const canReview = b.status === 'completed' && !DB.findOne(DB.KEYS.REVIEWS, r => r.bookingId === b.id && r.userId === b.userId);

    return `
    <div class="booking-list-item" data-booking-id="${b.id}">
      <div class="booking-list-img">
        <img src="${hotel.images[0]}" alt="${hotel.name}" loading="lazy">
      </div>
      <div class="booking-list-info">
        <div class="booking-list-hotel">${hotel.name}</div>
        <div class="booking-list-room">🛏️ ${room.name}</div>
        <div class="booking-list-loc">📍 ${hotel.location}</div>
        <div class="booking-list-dates">
          ${formatDateShort(b.checkIn)} → ${formatDateShort(b.checkOut)} · ${b.nights} nights · ${b.guests.adults} guests
        </div>
        <div class="booking-list-meta">
          ${statusBadge(b.status)}
          <span class="booking-list-ref">Ref: ${b.id}</span>
          <span class="booking-list-date">Booked ${formatDateShort(b.createdAt)}</span>
        </div>
      </div>
      <div class="booking-list-actions">
        <div class="booking-list-price">${formatCurrency(b.totalAmount)}</div>
        <a href="booking-confirmation.html?id=${b.id}" class="btn btn-outline btn-sm">View Details</a>
        ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="cancelMyBooking('${b.id}')">Cancel</button>` : ''}
        ${canReview ? `<a href="reviews.html?bookingId=${b.id}&hotelId=${b.hotelId}" class="btn btn-secondary btn-sm">Write Review</a>` : ''}
      </div>
    </div>`;
  }).join('');
}

function cancelMyBooking(bookingId) {
  showModal('Cancel Booking', `
    <p>Are you sure you want to cancel booking <strong>${bookingId}</strong>?</p>
    <p class="text-warning">⚠️ This action cannot be undone.</p>`,
    [
      { label: 'Keep Booking', class: 'btn btn-secondary', onclick: 'closeModal()' },
      { label: 'Yes, Cancel', class: 'btn btn-danger', onclick: `confirmCancelBooking('${bookingId}')` }
    ]
  );
}

function confirmCancelBooking(bookingId) {
  const result = Booking.cancel(bookingId);
  closeModal();
  if (result.success) {
    showToast('Booking cancelled successfully.', 'success');
    setTimeout(() => { window.location.reload(); }, 800);
  } else {
    showToast(result.message, 'error');
  }
}

// ============================================================
// WISHLIST PAGE
// ============================================================

function initWishlistPage() {
  const user = Auth.requireLogin();
  if (!user) return;
  initPage();

  const wishlistIds = getWishlistIds(user.id);
  const hotels = wishlistIds.map(id => Hotels.getById(id)).filter(Boolean);
  const container = document.getElementById('wishlist-container');
  if (!container) return;

  document.getElementById('wishlist-count') && (document.getElementById('wishlist-count').textContent = hotels.length + ' saved');

  if (!hotels.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❤️</div>
        <h3>Your wishlist is empty</h3>
        <p>Save hotels and resorts you love by clicking the ♥ button.</p>
        <a href="hotels.html" class="btn btn-primary">Explore Hotels</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="hotels-grid">${hotels.map(h => renderHotelCard(h, wishlistIds)).join('')}</div>`;
}
