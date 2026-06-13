// ============================================================
// STAYEASE - DASHBOARD MODULE
// ============================================================

// ============================================================
// OWNER DASHBOARD
// ============================================================

function initOwnerDashboard() {
  const user = Auth.requireRole('owner');
  if (!user) return;
  initPage();

  const hotels = DB.findAll(DB.KEYS.HOTELS, h => h.ownerId === user.id);
  const hotelIds = hotels.map(h => h.id);
  const allBookings = DB.getAll(DB.KEYS.BOOKINGS);
  const bookings = allBookings.filter(b => hotelIds.includes(b.hotelId));
  const reviews = DB.getAll(DB.KEYS.REVIEWS).filter(r => hotelIds.includes(r.hotelId));

  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled').reduce((s, b) => s + b.totalAmount, 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  // Stats
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-hotels', hotels.length);
  set('stat-bookings', bookings.length);
  set('stat-revenue', formatCurrency(totalRevenue));
  set('stat-reviews', reviews.length);
  set('stat-pending', pendingBookings);
  set('stat-rating', avgRating);

  // Hotels list
  renderOwnerHotels(hotels, hotelIds);

  // Recent bookings
  renderOwnerRecentBookings(bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

  // Revenue chart
  renderRevenueChart('revenue-chart', bookings);

  // Owner name
  const greetEl = document.getElementById('owner-greeting');
  if (greetEl) greetEl.textContent = 'Welcome back, ' + user.name + '!';
}

function renderOwnerHotels(hotels, hotelIds) {
  const el = document.getElementById('owner-hotels-list');
  if (!el) return;
  if (!hotels.length) { el.innerHTML = '<p class="text-light">No hotels listed yet. <a href="manage-rooms.html">Add your first hotel</a></p>'; return; }

  el.innerHTML = hotels.map(h => {
    const hBookings = DB.findAll(DB.KEYS.BOOKINGS, b => b.hotelId === h.id);
    const hRevenue = hBookings.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled').reduce((s, b) => s + b.totalAmount, 0);
    const rooms = Hotels.getRooms(h.id);
    return `
    <div class="owner-hotel-row">
      <img src="${h.images[0]}" alt="${h.name}" class="owner-hotel-thumb">
      <div class="owner-hotel-info">
        <div class="owner-hotel-name">${h.name}</div>
        <div class="owner-hotel-loc">📍 ${h.location}</div>
        <div class="owner-hotel-meta">
          ${statusBadge(h.status)} · ${rooms.length} room types · ${hBookings.length} bookings
        </div>
      </div>
      <div class="owner-hotel-stats">
        <div class="owner-stat-item"><span>Revenue</span><strong>${formatCurrency(hRevenue)}</strong></div>
        <div class="owner-stat-item"><span>Rating</span><strong>${renderStars(h.rating)}</strong></div>
      </div>
      <div class="owner-hotel-actions">
        <a href="manage-rooms.html?hotelId=${h.id}" class="btn btn-outline btn-sm">Manage Rooms</a>
        <a href="manage-bookings.html?hotelId=${h.id}" class="btn btn-primary btn-sm">Bookings</a>
      </div>
    </div>`;
  }).join('');
}

function renderOwnerRecentBookings(bookings) {
  const el = document.getElementById('recent-bookings-table');
  if (!el) return;
  if (!bookings.length) { el.innerHTML = '<tr><td colspan="6" class="text-center">No bookings yet</td></tr>'; return; }

  el.innerHTML = bookings.map(b => {
    const hotel = Hotels.getById(b.hotelId);
    const room = Hotels.getRoomById(b.roomId);
    return `
    <tr>
      <td><a href="booking-confirmation.html?id=${b.id}">${b.id}</a></td>
      <td>${b.guestInfo.firstName} ${b.guestInfo.lastName}</td>
      <td>${hotel?.name || 'N/A'} · ${room?.name || ''}</td>
      <td>${formatDateShort(b.checkIn)} – ${formatDateShort(b.checkOut)}</td>
      <td>${formatCurrency(b.totalAmount)}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>`;
  }).join('');
}

function renderRevenueChart(containerId, bookings) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = months.map((m, idx) => {
    const total = bookings
      .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled' && new Date(b.createdAt).getMonth() === idx)
      .reduce((s, b) => s + b.totalAmount, 0);
    return { month: m, total };
  });

  const max = Math.max(...data.map(d => d.total), 1);
  el.innerHTML = `
    <div class="chart-bars">
      ${data.map(d => `
        <div class="chart-col">
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height:${Math.round(d.total / max * 100)}%" title="${formatCurrency(d.total)}">
              <div class="chart-bar-tooltip">${formatCurrency(d.total)}</div>
            </div>
          </div>
          <div class="chart-label">${d.month}</div>
        </div>`).join('')}
    </div>`;
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function initAdminDashboard() {
  const user = Auth.requireRole('admin');
  if (!user) return;
  initPage();

  const users = DB.getAll(DB.KEYS.USERS);
  const hotels = DB.getAll(DB.KEYS.HOTELS);
  const bookings = DB.getAll(DB.KEYS.BOOKINGS);
  const reviews = DB.getAll(DB.KEYS.REVIEWS);

  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled').reduce((s, b) => s + b.totalAmount, 0);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('admin-stat-users', users.length);
  set('admin-stat-hotels', hotels.length);
  set('admin-stat-bookings', bookings.length);
  set('admin-stat-revenue', formatCurrency(totalRevenue));
  set('admin-stat-reviews', reviews.length);
  set('admin-stat-pending', bookings.filter(b => b.status === 'confirmed').length);

  renderAdminUsersTable(users);
  renderAdminHotelsTable(hotels);
  renderAdminBookingsTable(bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
  renderAdminReviewsTable(reviews.slice(0, 10));
  renderAdminCharts(bookings, users);
}

function renderAdminUsersTable(users) {
  const el = document.getElementById('admin-users-table');
  if (!el) return;
  el.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'owner' ? 'badge-info' : 'badge-primary'}">${u.role}</span></td>
      <td>${formatDateShort(u.createdAt)}</td>
      <td>${statusBadge(u.status)}</td>
      <td>
        <button class="btn btn-outline btn-xs" onclick="toggleUserStatus(${u.id}, '${u.status}')">
          ${u.status === 'active' ? 'Suspend' : 'Activate'}
        </button>
      </td>
    </tr>`).join('');
}

function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  DB.update(DB.KEYS.USERS, userId, { status: newStatus });
  showToast('User status updated.', 'success');
  setTimeout(() => { window.location.reload(); }, 600);
}

function renderAdminHotelsTable(hotels) {
  const el = document.getElementById('admin-hotels-table');
  if (!el) return;
  el.innerHTML = hotels.map(h => `
    <tr>
      <td>${h.id}</td>
      <td><strong>${h.name}</strong></td>
      <td>${h.location}</td>
      <td>${h.category}</td>
      <td>${renderStars(h.rating)}</td>
      <td>${formatCurrency(h.priceFrom)}</td>
      <td>${statusBadge(h.status)}</td>
      <td>
        ${h.status !== 'approved' ? `<button class="btn btn-success btn-xs" onclick="approveHotel(${h.id})">Approve</button>` : ''}
        ${h.status === 'approved' ? `<button class="btn btn-warning btn-xs" onclick="rejectHotel(${h.id})">Suspend</button>` : ''}
        <a href="hotel-details.html?id=${h.id}" class="btn btn-outline btn-xs">View</a>
      </td>
    </tr>`).join('');
}

function approveHotel(hotelId) {
  DB.update(DB.KEYS.HOTELS, hotelId, { status: 'approved' });
  showToast('Hotel approved.', 'success');
  setTimeout(() => { window.location.reload(); }, 600);
}

function rejectHotel(hotelId) {
  DB.update(DB.KEYS.HOTELS, hotelId, { status: 'suspended' });
  showToast('Hotel suspended.', 'warning');
  setTimeout(() => { window.location.reload(); }, 600);
}

function renderAdminBookingsTable(bookings) {
  const el = document.getElementById('admin-bookings-table');
  if (!el) return;
  el.innerHTML = bookings.map(b => {
    const hotel = Hotels.getById(b.hotelId);
    return `
    <tr>
      <td><a href="booking-confirmation.html?id=${b.id}">${b.id}</a></td>
      <td>${b.guestInfo.firstName} ${b.guestInfo.lastName}</td>
      <td>${hotel?.name || 'N/A'}</td>
      <td>${formatDateShort(b.checkIn)} – ${formatDateShort(b.checkOut)}</td>
      <td>${formatCurrency(b.totalAmount)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${statusBadge(b.paymentStatus)}</td>
    </tr>`;
  }).join('');
}

function renderAdminReviewsTable(reviews) {
  const el = document.getElementById('admin-reviews-table');
  if (!el) return;
  el.innerHTML = reviews.map(r => {
    const hotel = Hotels.getById(r.hotelId);
    return `
    <tr>
      <td>${r.id}</td>
      <td>${r.userName}</td>
      <td>${hotel?.name || 'N/A'}</td>
      <td>${renderStars(r.rating)}</td>
      <td>${r.title}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <button class="btn btn-danger btn-xs" onclick="adminDeleteReview(${r.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function adminDeleteReview(reviewId) {
  if (confirm('Delete this review?')) {
    Reviews.delete(reviewId);
    showToast('Review deleted.', 'success');
    setTimeout(() => { window.location.reload(); }, 600);
  }
}

function renderAdminCharts(bookings, users) {
  // Bookings by status donut-style as CSS bars
  const statusCounts = ['confirmed', 'completed', 'checked-in', 'pending', 'cancelled'].map(s => ({
    status: s, count: bookings.filter(b => b.status === s).length
  }));
  const statusEl = document.getElementById('status-chart');
  if (statusEl) {
    const max = Math.max(...statusCounts.map(s => s.count), 1);
    statusEl.innerHTML = `<div class="status-bars">` + statusCounts.map(s => `
      <div class="status-bar-row">
        <span class="status-bar-label">${s.status.replace('-', ' ')}</span>
        <div class="status-bar-track"><div class="status-bar-fill status-${s.status}" style="width:${Math.round(s.count / max * 100)}%"></div></div>
        <span class="status-bar-count">${s.count}</span>
      </div>`).join('') + '</div>';
  }

  // Revenue chart
  renderRevenueChart('admin-revenue-chart', bookings);

  // User registrations
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const userChartEl = document.getElementById('users-chart');
  if (userChartEl) {
    const data = months.map((m, idx) => ({
      month: m,
      count: users.filter(u => new Date(u.createdAt).getMonth() === idx).length
    }));
    const max = Math.max(...data.map(d => d.count), 1);
    userChartEl.innerHTML = `<div class="chart-bars">` + data.map(d => `
      <div class="chart-col">
        <div class="chart-bar-wrap">
          <div class="chart-bar chart-bar-green" style="height:${Math.round(d.count / max * 100)}%" title="${d.count} users">
            <div class="chart-bar-tooltip">${d.count} users</div>
          </div>
        </div>
        <div class="chart-label">${d.month}</div>
      </div>`).join('') + '</div>';
  }
}

// ============================================================
// MANAGE ROOMS PAGE
// ============================================================

function initManageRoomsPage() {
  const user = Auth.requireRole('owner');
  if (!user) return;
  initPage();

  const hotelId = getUrlParam('hotelId');
  let hotel = hotelId ? Hotels.getById(hotelId) : DB.findOne(DB.KEYS.HOTELS, h => h.ownerId === user.id);

  if (!hotel && user.role !== 'admin') {
    document.getElementById('rooms-content').innerHTML = `<div class="empty-state"><h3>No hotel found</h3><p>You don't have any hotels listed yet.</p></div>`;
    return;
  }
  if (!hotel) hotel = Hotels.getAll()[0]; // fallback for admin

  document.getElementById('manage-hotel-name') && (document.getElementById('manage-hotel-name').textContent = hotel.name);
  document.getElementById('manage-hotel-loc') && (document.getElementById('manage-hotel-loc').textContent = hotel.location);

  loadRoomsTable(hotel.id);

  document.getElementById('add-room-btn')?.addEventListener('click', () => showRoomForm(hotel.id));
}

function loadRoomsTable(hotelId) {
  const rooms = Hotels.getRooms(hotelId);
  const el = document.getElementById('rooms-table-body');
  if (!el) return;

  if (!rooms.length) {
    el.innerHTML = '<tr><td colspan="8" class="text-center">No rooms added yet.</td></tr>';
    return;
  }

  el.innerHTML = rooms.map(r => `
    <tr>
      <td>${r.id}</td>
      <td><strong>${r.name}</strong><br><small>${r.type}</small></td>
      <td>${r.bedType}</td>
      <td>${r.size} m²</td>
      <td>${r.capacity.adults} adults, ${r.capacity.children} children</td>
      <td>${formatCurrency(r.price)}/night</td>
      <td>${r.availableCount} / ${r.totalCount}</td>
      <td>
        <button class="btn btn-outline btn-xs" onclick="editRoom(${r.id}, ${hotelId})">Edit</button>
        <button class="btn btn-danger btn-xs" onclick="deleteRoom(${r.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function showRoomForm(hotelId, existingRoomId = null) {
  const existing = existingRoomId ? Hotels.getRoomById(existingRoomId) : null;
  const amenityList = ['ac', 'tv', 'minibar', 'safe', 'wifi', 'bathtub', 'balcony', 'sea-view', 'garden-view', 'jacuzzi', 'plunge-pool', 'work-desk', 'kitchen'];

  const formHTML = `
    <form id="room-form" class="room-form">
      <div class="form-row">
        <div class="form-group">
          <label>Room Name *</label>
          <input type="text" id="rf-name" class="form-control" value="${existing?.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Room Type *</label>
          <select id="rf-type" class="form-control">
            ${['standard','deluxe','suite','villa','bungalow'].map(t => `<option value="${t}" ${existing?.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Bed Type *</label>
          <input type="text" id="rf-bed" class="form-control" placeholder="e.g. King, Queen, Twin" value="${existing?.bedType || ''}">
        </div>
        <div class="form-group">
          <label>Size (m²)</label>
          <input type="number" id="rf-size" class="form-control" min="1" value="${existing?.size || 25}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Max Adults</label>
          <input type="number" id="rf-adults" class="form-control" min="1" max="10" value="${existing?.capacity?.adults || 2}">
        </div>
        <div class="form-group">
          <label>Max Children</label>
          <input type="number" id="rf-children" class="form-control" min="0" max="5" value="${existing?.capacity?.children || 0}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Price per Night ($) *</label>
          <input type="number" id="rf-price" class="form-control" min="1" value="${existing?.price || 100}">
        </div>
        <div class="form-group">
          <label>Original Price ($)</label>
          <input type="number" id="rf-orig-price" class="form-control" min="1" value="${existing?.originalPrice || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Total Rooms</label>
          <input type="number" id="rf-total" class="form-control" min="1" value="${existing?.totalCount || 5}">
        </div>
        <div class="form-group">
          <label>Available Now</label>
          <input type="number" id="rf-available" class="form-control" min="0" value="${existing?.availableCount || 5}">
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="rf-desc" class="form-control" rows="3">${existing?.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Amenities</label>
        <div class="amenity-checkboxes">
          ${amenityList.map(a => `
            <label class="checkbox-label">
              <input type="checkbox" value="${a}" class="rf-amenity" ${existing?.amenities?.includes(a) ? 'checked' : ''}>
              ${AMENITY_MAP[a]?.icon || '✓'} ${AMENITY_MAP[a]?.label || a}
            </label>`).join('')}
        </div>
      </div>
    </form>`;

  showModal(existing ? 'Edit Room' : 'Add New Room', formHTML, [
    { label: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
    { label: existing ? 'Update Room' : 'Add Room', class: 'btn btn-primary', onclick: `saveRoom(${hotelId}, ${existingRoomId || 'null'})` }
  ], 'lg');
}

function editRoom(roomId, hotelId) { showRoomForm(hotelId, roomId); }

function saveRoom(hotelId, existingRoomId) {
  const name = document.getElementById('rf-name')?.value.trim();
  const type = document.getElementById('rf-type')?.value;
  const bedType = document.getElementById('rf-bed')?.value.trim();
  const size = parseInt(document.getElementById('rf-size')?.value) || 25;
  const adults = parseInt(document.getElementById('rf-adults')?.value) || 2;
  const children = parseInt(document.getElementById('rf-children')?.value) || 0;
  const price = parseFloat(document.getElementById('rf-price')?.value);
  const originalPrice = parseFloat(document.getElementById('rf-orig-price')?.value) || price;
  const totalCount = parseInt(document.getElementById('rf-total')?.value) || 5;
  const availableCount = parseInt(document.getElementById('rf-available')?.value) || totalCount;
  const description = document.getElementById('rf-desc')?.value.trim();
  const amenities = [...document.querySelectorAll('.rf-amenity:checked')].map(el => el.value);

  if (!name || !bedType || !price) { showToast('Please fill all required fields.', 'warning'); return; }

  if (existingRoomId) {
    DB.update(DB.KEYS.ROOMS, parseInt(existingRoomId), { name, type, bedType, size, capacity: { adults, children }, price, originalPrice, totalCount, availableCount, description, amenities });
    showToast('Room updated!', 'success');
  } else {
    const newRoom = {
      id: DB.nextId(DB.KEYS.ROOMS),
      hotelId: parseInt(hotelId),
      name, type, bedType, size,
      capacity: { adults, children },
      price, originalPrice,
      description,
      images: [`https://picsum.photos/seed/room${DB.nextId(DB.KEYS.ROOMS)}/700/450`],
      amenities, availableCount, totalCount
    };
    DB.insert(DB.KEYS.ROOMS, newRoom);
    showToast('Room added!', 'success');
  }

  closeModal();
  loadRoomsTable(parseInt(hotelId));
}

function deleteRoom(roomId) {
  showModal('Delete Room', '<p>Are you sure you want to delete this room? This cannot be undone.</p>',
    [
      { label: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
      { label: 'Delete', class: 'btn btn-danger', onclick: `confirmDeleteRoom(${roomId})` }
    ]
  );
}

function confirmDeleteRoom(roomId) {
  const hotelId = getUrlParam('hotelId') || DB.findOne(DB.KEYS.ROOMS, r => r.id === parseInt(roomId))?.hotelId;
  DB.delete(DB.KEYS.ROOMS, parseInt(roomId));
  closeModal();
  showToast('Room deleted.', 'success');
  if (hotelId) loadRoomsTable(parseInt(hotelId));
}

// ============================================================
// MANAGE BOOKINGS PAGE
// ============================================================

function initManageBookingsPage() {
  const user = Auth.requireRole('owner');
  if (!user) return;
  initPage();

  let allBookings;
  const hotelId = getUrlParam('hotelId');

  if (hotelId) {
    allBookings = Booking.getByHotel(hotelId);
    const hotel = Hotels.getById(hotelId);
    document.getElementById('manage-hotel-title') && (document.getElementById('manage-hotel-title').textContent = hotel ? hotel.name + ' – Bookings' : 'Bookings');
  } else if (user.role === 'admin') {
    allBookings = Booking.getAll();
    document.getElementById('manage-hotel-title') && (document.getElementById('manage-hotel-title').textContent = 'All Bookings');
  } else {
    const hotels = DB.findAll(DB.KEYS.HOTELS, h => h.ownerId === user.id);
    const hIds = hotels.map(h => h.id);
    allBookings = DB.getAll(DB.KEYS.BOOKINGS).filter(b => hIds.includes(b.hotelId));
  }

  allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let currentFilter = 'all';
  let searchQuery = '';

  const renderTable = () => {
    let list = currentFilter === 'all' ? allBookings : allBookings.filter(b => b.status === currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => b.id.toLowerCase().includes(q) || (b.guestInfo.firstName + ' ' + b.guestInfo.lastName).toLowerCase().includes(q) || b.guestInfo.email.toLowerCase().includes(q));
    }
    renderManageBookingsTable(list);
  };

  renderTable();

  document.querySelectorAll('.mb-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mb-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      renderTable();
    });
  });

  document.getElementById('bookings-search')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderTable();
  });
}

function renderManageBookingsTable(bookings) {
  const el = document.getElementById('manage-bookings-table');
  if (!el) return;

  if (!bookings.length) {
    el.innerHTML = '<tr><td colspan="8" class="text-center">No bookings found.</td></tr>';
    return;
  }

  el.innerHTML = bookings.map(b => {
    const hotel = Hotels.getById(b.hotelId);
    const room = Hotels.getRoomById(b.roomId);
    return `
    <tr>
      <td><a href="booking-confirmation.html?id=${b.id}">${b.id}</a></td>
      <td>${b.guestInfo.firstName} ${b.guestInfo.lastName}<br><small>${b.guestInfo.email}</small></td>
      <td>${hotel?.name || 'N/A'}<br><small>${room?.name || ''}</small></td>
      <td>${formatDateShort(b.checkIn)}<br>→ ${formatDateShort(b.checkOut)}<br><small>${b.nights} nights</small></td>
      <td>${b.guests.adults} adults</td>
      <td>${formatCurrency(b.totalAmount)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <select class="form-control form-control-xs" onchange="updateBookingStatus('${b.id}', this.value)">
          ${['pending','confirmed','checked-in','completed','cancelled'].map(s => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s.replace('-',' ')}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }).join('');
}

function updateBookingStatus(bookingId, newStatus) {
  Booking.updateStatus(bookingId, newStatus);
  showToast('Booking status updated to: ' + newStatus, 'success');
}
