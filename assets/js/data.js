// ============================================================
// STAYEASE - HOTEL BOOKING PLATFORM
// Data Layer & localStorage Management
// ============================================================

const DB = {
  KEYS: {
    USERS: 'hb_users',
    HOTELS: 'hb_hotels',
    ROOMS: 'hb_rooms',
    BOOKINGS: 'hb_bookings',
    REVIEWS: 'hb_reviews',
    WISHLIST: 'hb_wishlist',
    CURRENT_USER: 'hb_current_user',
    INQUIRIES: 'hb_inquiries',
    INITIALIZED: 'hb_initialized'
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(e) { return false; }
  },
  getAll(key) { return this.get(key) || []; },
  findAll(key, fn) { return this.getAll(key).filter(fn); },
  findOne(key, fn) { return this.getAll(key).find(fn) || null; },
  insert(key, item) {
    const items = this.getAll(key);
    items.push(item);
    this.set(key, items);
    return item;
  },
  update(key, id, updates) {
    const items = this.getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    this.set(key, items);
    return items[idx];
  },
  delete(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(i => i.id !== id);
    this.set(key, filtered);
    return filtered.length < items.length;
  },
  nextId(key) {
    const items = this.getAll(key);
    if (!items.length) return 1;
    return Math.max(...items.map(i => (typeof i.id === 'number' ? i.id : 0))) + 1;
  }
};

// ============================================================
// DEMO DATA
// ============================================================

const DEMO_USERS = [
  {
    id: 1, name: 'Alex Rivera', email: 'customer@example.com', password: 'password123',
    role: 'customer', phone: '+1 555-0101', avatar: null,
    address: '123 Main St, New York, NY', nationality: 'American',
    createdAt: '2024-01-15', status: 'active'
  },
  {
    id: 2, name: 'Maria Santos', email: 'owner@example.com', password: 'password123',
    role: 'owner', phone: '+63 917-5551234', avatar: null,
    address: 'Boracay Island, Aklan, Philippines', nationality: 'Filipino',
    createdAt: '2024-01-10', status: 'active', businessName: 'Santos Resorts Group'
  },
  {
    id: 3, name: 'Admin User', email: 'admin@example.com', password: 'password123',
    role: 'admin', phone: '+1 555-0100', avatar: null,
    address: 'HQ, San Francisco, CA', nationality: 'American',
    createdAt: '2024-01-01', status: 'active'
  },
  {
    id: 4, name: 'James Park', email: 'james@example.com', password: 'password123',
    role: 'customer', phone: '+1 555-0202', avatar: null,
    address: '45 Oak Ave, Chicago, IL', nationality: 'American',
    createdAt: '2024-02-20', status: 'active'
  },
  {
    id: 5, name: 'Linda Chen', email: 'linda@example.com', password: 'password123',
    role: 'customer', phone: '+1 555-0303', avatar: null,
    address: '78 Pine Rd, Los Angeles, CA', nationality: 'American',
    createdAt: '2024-03-05', status: 'active'
  }
];

const DEMO_HOTELS = [
  {
    id: 1, ownerId: 2,
    name: 'Grand Laguna Resort & Spa',
    slug: 'grand-laguna-resort',
    location: 'Boracay Island, Philippines',
    city: 'Boracay', country: 'Philippines',
    description: 'Experience unparalleled luxury at Grand Laguna Resort & Spa, nestled on the pristine white sands of Boracay Island. Our world-class resort offers breathtaking ocean views, exceptional dining, rejuvenating spa treatments, and personalized service that exceeds every expectation. Whether you seek adventure or tranquility, Grand Laguna delivers an unforgettable tropical escape.',
    shortDesc: 'Luxury beachfront resort with world-class spa and ocean views',
    rating: 4.9, reviewCount: 324, stars: 5,
    category: 'resort',
    amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant', 'bar', 'beach', 'parking', 'ac', 'concierge', 'kids-club', 'water-sports'],
    images: [
      'https://picsum.photos/seed/hotel1a/900/600',
      'https://picsum.photos/seed/hotel1b/900/600',
      'https://picsum.photos/seed/hotel1c/900/600',
      'https://picsum.photos/seed/hotel1d/900/600'
    ],
    featured: true, status: 'approved', priceFrom: 250,
    policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation until 48 hours before check-in', pets: 'Pets not allowed', smoking: 'Non-smoking property' },
    address: 'Station 1, White Beach, Boracay Island, Aklan 5608', phone: '+63 36 288-0000',
    email: 'reservations@grandlaguna.ph', website: 'www.grandlaguna.ph',
    tags: ['beachfront', 'luxury', 'spa', 'family'],
    popular: true, createdAt: '2024-01-15'
  },
  {
    id: 2, ownerId: 2,
    name: 'Azure Paradise Hotel',
    slug: 'azure-paradise-hotel',
    location: 'Palawan, Philippines',
    city: 'El Nido', country: 'Philippines',
    description: 'Discover the natural wonder of Palawan at Azure Paradise Hotel. Surrounded by towering limestone karsts and crystal-clear lagoons, our eco-luxury resort harmonizes modern comfort with pristine nature. Explore hidden beaches, snorkel vibrant coral reefs, and return each evening to elegantly designed villas with panoramic sea views.',
    shortDesc: 'Eco-luxury villas amid Palawan\'s stunning limestone karsts',
    rating: 4.8, reviewCount: 218, stars: 5,
    category: 'resort',
    amenities: ['pool', 'spa', 'wifi', 'restaurant', 'bar', 'beach', 'ac', 'diving', 'kayaking', 'yoga'],
    images: [
      'https://picsum.photos/seed/hotel2a/900/600',
      'https://picsum.photos/seed/hotel2b/900/600',
      'https://picsum.photos/seed/hotel2c/900/600',
      'https://picsum.photos/seed/hotel2d/900/600'
    ],
    featured: true, status: 'approved', priceFrom: 320,
    policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'Free cancellation until 72 hours before check-in', pets: 'Pets not allowed', smoking: 'Designated smoking areas' },
    address: 'Corong-Corong, El Nido, Palawan 5313', phone: '+63 48 723-0000',
    email: 'info@azureparadise.ph', website: 'www.azureparadise.ph',
    tags: ['eco-luxury', 'island', 'diving', 'romantic'],
    popular: true, createdAt: '2024-01-20'
  },
  {
    id: 3, ownerId: 2,
    name: 'Royal Summit Hotel',
    slug: 'royal-summit-hotel',
    location: 'Tagaytay, Philippines',
    city: 'Tagaytay', country: 'Philippines',
    description: 'Perched high above Taal Lake with commanding views of the iconic Taal Volcano, Royal Summit Hotel offers a cool mountain retreat unlike any other. Our modern hotel combines Filipino heritage architecture with contemporary luxury, offering award-winning cuisine, a world-class spa, and personalized hospitality in a truly spectacular highland setting.',
    shortDesc: 'Mountain retreat with spectacular Taal Volcano and lake views',
    rating: 4.7, reviewCount: 186, stars: 4,
    category: 'hotel',
    amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant', 'bar', 'parking', 'ac', 'meeting-rooms', 'fireplace'],
    images: [
      'https://picsum.photos/seed/hotel3a/900/600',
      'https://picsum.photos/seed/hotel3b/900/600',
      'https://picsum.photos/seed/hotel3c/900/600',
      'https://picsum.photos/seed/hotel3d/900/600'
    ],
    featured: true, status: 'approved', priceFrom: 130,
    policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation until 24 hours before check-in', pets: 'Small pets allowed', smoking: 'No smoking indoors' },
    address: 'Aguinaldo Highway, Tagaytay City, Cavite 4120', phone: '+63 46 413-0000',
    email: 'stay@royalsummit.ph', website: 'www.royalsummit.ph',
    tags: ['mountain', 'couples', 'family', 'spa'],
    popular: true, createdAt: '2024-02-01'
  },
  {
    id: 4, ownerId: 2,
    name: 'Cebu Sunrise Beach Resort',
    slug: 'cebu-sunrise-beach-resort',
    location: 'Mactan, Cebu, Philippines',
    city: 'Cebu', country: 'Philippines',
    description: 'Wake up to golden sunrises over the Visayan Sea at Cebu Sunrise Beach Resort. Our stunning beachfront property on Mactan Island offers the perfect blend of relaxation and adventure. Dive into colorful coral reefs, enjoy island-hopping tours, or simply unwind on our private beach with a refreshing cocktail in hand.',
    shortDesc: 'Vibrant beachfront resort on Mactan Island with watersports',
    rating: 4.6, reviewCount: 267, stars: 4,
    category: 'resort',
    amenities: ['pool', 'wifi', 'restaurant', 'bar', 'beach', 'parking', 'ac', 'diving', 'kids-pool', 'water-sports'],
    images: [
      'https://picsum.photos/seed/hotel4a/900/600',
      'https://picsum.photos/seed/hotel4b/900/600',
      'https://picsum.photos/seed/hotel4c/900/600',
      'https://picsum.photos/seed/hotel4d/900/600'
    ],
    featured: false, status: 'approved', priceFrom: 150,
    policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation until 24 hours before check-in', pets: 'Not allowed', smoking: 'Designated areas only' },
    address: 'Punta Engaño Rd, Lapu-Lapu City, Cebu 6015', phone: '+63 32 495-0000',
    email: 'reservations@cebusunrise.ph',
    tags: ['beachfront', 'family', 'diving', 'watersports'],
    popular: true, createdAt: '2024-02-10'
  },
  {
    id: 5, ownerId: 2,
    name: 'Manila Metropolitan Hotel',
    slug: 'manila-metropolitan-hotel',
    location: 'Makati, Manila, Philippines',
    city: 'Manila', country: 'Philippines',
    description: 'In the heart of Manila\'s premier business and lifestyle district, Manila Metropolitan Hotel stands as the city\'s most distinguished address. Our urban sanctuary offers sophisticated accommodations, Michelin-starred dining experiences, an exclusive rooftop pool, and seamless connectivity for business and leisure travelers alike.',
    shortDesc: 'Premier 5-star business hotel in the heart of Makati CBD',
    rating: 4.8, reviewCount: 412, stars: 5,
    category: 'hotel',
    amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant', 'bar', 'parking', 'ac', 'business-center', 'concierge', 'laundry', 'airport-shuttle'],
    images: [
      'https://picsum.photos/seed/hotel5a/900/600',
      'https://picsum.photos/seed/hotel5b/900/600',
      'https://picsum.photos/seed/hotel5c/900/600',
      'https://picsum.photos/seed/hotel5d/900/600'
    ],
    featured: true, status: 'approved', priceFrom: 220,
    policies: { checkIn: '15:00', checkOut: '12:00', cancellation: 'Free cancellation until 24 hours before check-in', pets: 'Not allowed', smoking: 'No smoking' },
    address: 'Ayala Avenue corner Makati Avenue, Makati City 1226', phone: '+63 2 8888-0000',
    email: 'reservations@manilametro.ph',
    tags: ['business', 'luxury', 'city', 'rooftop'],
    popular: true, createdAt: '2024-01-25'
  },
  {
    id: 6, ownerId: 2,
    name: 'Siargao Surf & Stays',
    slug: 'siargao-surf-stays',
    location: 'Siargao Island, Philippines',
    city: 'Siargao', country: 'Philippines',
    description: 'Catch the perfect wave at Siargao Surf & Stays, situated steps away from the legendary Cloud 9 surf break. Our laid-back boutique resort captures the raw spirit of the Surfing Capital of the Philippines with rustic-chic design, a vibrant beach bar, surf lessons for all levels, and island tours to undiscovered gems.',
    shortDesc: 'Boutique surf resort near Cloud 9, the legendary surf break',
    rating: 4.5, reviewCount: 143, stars: 3,
    category: 'boutique',
    amenities: ['pool', 'wifi', 'restaurant', 'bar', 'beach', 'surfing', 'island-hopping', 'bikes'],
    images: [
      'https://picsum.photos/seed/hotel6a/900/600',
      'https://picsum.photos/seed/hotel6b/900/600',
      'https://picsum.photos/seed/hotel6c/900/600',
      'https://picsum.photos/seed/hotel6d/900/600'
    ],
    featured: false, status: 'approved', priceFrom: 90,
    policies: { checkIn: '13:00', checkOut: '11:00', cancellation: 'Free cancellation until 48 hours before check-in', pets: 'Dogs welcome', smoking: 'Outdoor areas only' },
    address: 'Tourism Road, General Luna, Siargao, Surigao del Norte', phone: '+63 915-555-0001',
    email: 'hello@siargaosurfstays.ph',
    tags: ['surf', 'beach', 'boutique', 'backpacker'],
    popular: false, createdAt: '2024-03-01'
  },
  {
    id: 7, ownerId: 2,
    name: 'Bohol Heritage Inn',
    slug: 'bohol-heritage-inn',
    location: 'Panglao, Bohol, Philippines',
    city: 'Bohol', country: 'Philippines',
    description: 'Discover the charm of Bohol at Heritage Inn, a beautifully restored colonial-era property on pristine Panglao Island. Our intimate boutique hotel features just 24 individually styled rooms, a garden pool, and direct beach access. Explore the famous Chocolate Hills, swim with whale sharks, and experience authentic Boholano hospitality.',
    shortDesc: 'Charming colonial-era boutique hotel on Panglao Island',
    rating: 4.4, reviewCount: 98, stars: 4,
    category: 'boutique',
    amenities: ['pool', 'wifi', 'restaurant', 'beach', 'ac', 'diving', 'island-tours', 'bikes'],
    images: [
      'https://picsum.photos/seed/hotel7a/900/600',
      'https://picsum.photos/seed/hotel7b/900/600',
      'https://picsum.photos/seed/hotel7c/900/600',
      'https://picsum.photos/seed/hotel7d/900/600'
    ],
    featured: false, status: 'approved', priceFrom: 110,
    policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation until 24 hours before check-in', pets: 'Not allowed', smoking: 'Outdoor areas' },
    address: 'Alona Beach, Panglao Island, Bohol 6340', phone: '+63 38 502-0000',
    email: 'stay@boholheritage.ph',
    tags: ['boutique', 'heritage', 'diving', 'nature'],
    popular: false, createdAt: '2024-03-15'
  },
  {
    id: 8, ownerId: 2,
    name: 'Davao Garden Hotel',
    slug: 'davao-garden-hotel',
    location: 'Davao City, Philippines',
    city: 'Davao', country: 'Philippines',
    description: 'A tranquil oasis in the heart of the Philippines\' largest city, Davao Garden Hotel surrounds guests with lush tropical gardens and modern comforts. Our family-friendly property features multiple pools, a renowned durian-themed dining experience, easy access to Mt. Apo trekking, and the freshest local fruits you\'ll ever taste.',
    shortDesc: 'Tropical garden hotel in the Durian Capital of the Philippines',
    rating: 4.3, reviewCount: 175, stars: 4,
    category: 'hotel',
    amenities: ['pool', 'wifi', 'gym', 'restaurant', 'bar', 'parking', 'ac', 'kids-club', 'garden', 'shuttle'],
    images: [
      'https://picsum.photos/seed/hotel8a/900/600',
      'https://picsum.photos/seed/hotel8b/900/600',
      'https://picsum.photos/seed/hotel8c/900/600',
      'https://picsum.photos/seed/hotel8d/900/600'
    ],
    featured: false, status: 'approved', priceFrom: 100,
    policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation until 24 hours before check-in', pets: 'Small pets welcome', smoking: 'Garden smoking areas' },
    address: 'J.P. Laurel Avenue, Davao City, Davao del Sur 8000', phone: '+63 82 226-0000',
    email: 'reservations@davaogarden.ph',
    tags: ['family', 'garden', 'city', 'nature'],
    popular: false, createdAt: '2024-02-25'
  }
];

const DEMO_ROOMS = [
  // Hotel 1 - Grand Laguna Resort
  { id: 101, hotelId: 1, name: 'Deluxe Beachfront Room', type: 'deluxe', capacity: { adults: 2, children: 1 }, size: 40, bedType: 'King', price: 250, originalPrice: 300, amenities: ['ac', 'tv', 'minibar', 'safe', 'balcony', 'wifi', 'bathtub', 'ocean-view'], description: 'Wake up to stunning ocean vistas in our spacious Deluxe Beachfront Room. Features a private balcony overlooking the White Beach, a king-size bed with premium linens, and a marble bathroom with a soaking tub.', images: ['https://picsum.photos/seed/room101/700/450', 'https://picsum.photos/seed/room101b/700/450'], availableCount: 4, totalCount: 8 },
  { id: 102, hotelId: 1, name: 'Ocean View Suite', type: 'suite', capacity: { adults: 2, children: 2 }, size: 75, bedType: 'King + Sofa Bed', price: 450, originalPrice: 550, amenities: ['ac', 'tv', 'minibar', 'safe', 'balcony', 'wifi', 'jacuzzi', 'ocean-view', 'living-room', 'kitchen'], description: 'Our signature Ocean View Suite redefines luxury with a separate living room, a private Jacuzzi on the terrace, and an open-plan bedroom with floor-to-ceiling windows showcasing unparalleled views of the Sibuyan Sea.', images: ['https://picsum.photos/seed/room102/700/450', 'https://picsum.photos/seed/room102b/700/450'], availableCount: 2, totalCount: 4 },
  { id: 103, hotelId: 1, name: 'Garden Studio', type: 'standard', capacity: { adults: 2, children: 0 }, size: 28, bedType: 'Queen', price: 180, originalPrice: 200, amenities: ['ac', 'tv', 'wifi', 'safe', 'garden-view', 'shower'], description: 'A cozy and stylish retreat with lush garden views, a comfortable queen bed, and all essential amenities for a delightful stay. Perfect for couples seeking comfort at great value.', images: ['https://picsum.photos/seed/room103/700/450'], availableCount: 6, totalCount: 10 },
  // Hotel 2 - Azure Paradise Hotel
  { id: 201, hotelId: 2, name: 'Cliffside Villa', type: 'villa', capacity: { adults: 2, children: 1 }, size: 90, bedType: 'King', price: 420, originalPrice: 500, amenities: ['ac', 'tv', 'minibar', 'safe', 'plunge-pool', 'wifi', 'bathtub', 'sea-view', 'outdoor-shower', 'deck'], description: 'Perched on dramatic limestone cliffs, our Cliffside Villa offers absolute privacy with a private plunge pool, an outdoor deck with hammocks, and sweeping views of the Bacuit Archipelago.', images: ['https://picsum.photos/seed/room201/700/450', 'https://picsum.photos/seed/room201b/700/450'], availableCount: 3, totalCount: 6 },
  { id: 202, hotelId: 2, name: 'Overwater Bungalow', type: 'suite', capacity: { adults: 2, children: 0 }, size: 65, bedType: 'King', price: 550, originalPrice: 650, amenities: ['ac', 'tv', 'minibar', 'safe', 'wifi', 'bathtub', 'sea-view', 'deck', 'glass-floor', 'direct-access'], description: 'Our iconic Overwater Bungalows sit directly above the turquoise lagoon. Step from your glass-floor panel directly into the sea, or relax on your private deck as colourful fish swim beneath you.', images: ['https://picsum.photos/seed/room202/700/450'], availableCount: 2, totalCount: 5 },
  { id: 203, hotelId: 2, name: 'Garden Cottage', type: 'standard', capacity: { adults: 2, children: 1 }, size: 35, bedType: 'Queen', price: 320, originalPrice: 380, amenities: ['ac', 'tv', 'wifi', 'safe', 'garden-view', 'bathtub', 'outdoor-terrace'], description: 'Nestled among tropical gardens, our charming Garden Cottages offer a peaceful sanctuary with natural materials, an outdoor terrace, and easy access to resort facilities.', images: ['https://picsum.photos/seed/room203/700/450'], availableCount: 5, totalCount: 8 },
  // Hotel 3 - Royal Summit Hotel
  { id: 301, hotelId: 3, name: 'Volcano View Deluxe', type: 'deluxe', capacity: { adults: 2, children: 1 }, size: 38, bedType: 'King', price: 180, originalPrice: 220, amenities: ['ac', 'tv', 'minibar', 'safe', 'balcony', 'wifi', 'bathtub', 'volcano-view'], description: 'Front-row seats to the majestic Taal Volcano. Our Volcano View Deluxe rooms feature a private balcony perfectly positioned for sunrise views over the caldera lake.', images: ['https://picsum.photos/seed/room301/700/450'], availableCount: 5, totalCount: 12 },
  { id: 302, hotelId: 3, name: 'Highland Suite', type: 'suite', capacity: { adults: 2, children: 2 }, size: 68, bedType: 'King + Twin', price: 280, originalPrice: 350, amenities: ['ac', 'tv', 'minibar', 'safe', 'balcony', 'wifi', 'fireplace', 'living-room', 'lake-view'], description: 'Experience mountain luxury in our spacious Highland Suites, featuring a cosy fireplace, separate living area, and panoramic windows framing the entire lake and volcano.', images: ['https://picsum.photos/seed/room302/700/450'], availableCount: 3, totalCount: 6 },
  { id: 303, hotelId: 3, name: 'Forest Room', type: 'standard', capacity: { adults: 2, children: 0 }, size: 26, bedType: 'Double', price: 130, originalPrice: 150, amenities: ['ac', 'tv', 'wifi', 'safe', 'garden-view'], description: 'A comfortable and affordable room surrounded by pine trees, with all the essentials for a rejuvenating mountain stay.', images: ['https://picsum.photos/seed/room303/700/450'], availableCount: 8, totalCount: 15 },
  // Hotel 4 - Cebu Sunrise
  { id: 401, hotelId: 4, name: 'Beachfront Deluxe', type: 'deluxe', capacity: { adults: 2, children: 1 }, size: 36, bedType: 'King', price: 200, originalPrice: 240, amenities: ['ac', 'tv', 'wifi', 'minibar', 'safe', 'balcony', 'sea-view'], description: 'Direct beach access from your private balcony. Enjoy sunrise views over the Visayan Sea from this elegantly appointed room.', images: ['https://picsum.photos/seed/room401/700/450'], availableCount: 5, totalCount: 10 },
  { id: 402, hotelId: 4, name: 'Family Suite', type: 'suite', capacity: { adults: 2, children: 3 }, size: 72, bedType: 'King + Bunk Beds', price: 300, originalPrice: 360, amenities: ['ac', 'tv', 'wifi', 'safe', 'sea-view', 'kids-amenities', 'living-room'], description: 'The perfect home-away-from-home for families, with dedicated kids\' sleeping area, a games console, a living room, and two bathrooms.', images: ['https://picsum.photos/seed/room402/700/450'], availableCount: 4, totalCount: 8 },
  { id: 403, hotelId: 4, name: 'Superior Garden Room', type: 'standard', capacity: { adults: 2, children: 1 }, size: 30, bedType: 'Queen', price: 150, originalPrice: 180, amenities: ['ac', 'tv', 'wifi', 'safe', 'garden-view'], description: 'A comfortable garden-facing room ideal for budget-conscious travelers who still want quality amenities and beach resort access.', images: ['https://picsum.photos/seed/room403/700/450'], availableCount: 7, totalCount: 14 },
  // Hotel 5 - Manila Metropolitan
  { id: 501, hotelId: 5, name: 'Executive City Room', type: 'deluxe', capacity: { adults: 2, children: 0 }, size: 42, bedType: 'King', price: 280, originalPrice: 330, amenities: ['ac', 'tv', 'minibar', 'safe', 'wifi', 'bathtub', 'city-view', 'work-desk', 'express-checkout'], description: 'Designed for the modern executive, featuring a 55-inch Smart TV, a dedicated workspace with high-speed fiber internet, and sweeping city skyline views from upper floors.', images: ['https://picsum.photos/seed/room501/700/450'], availableCount: 6, totalCount: 20 },
  { id: 502, hotelId: 5, name: 'Presidential Suite', type: 'suite', capacity: { adults: 2, children: 2 }, size: 180, bedType: 'King', price: 800, originalPrice: 1000, amenities: ['ac', 'tv', 'minibar', 'safe', 'wifi', 'jacuzzi', 'city-view', 'butler', 'dining-room', 'kitchen', 'terrace'], description: 'The pinnacle of Manila luxury. Our two-storey Presidential Suite features a private terrace, a butler on call 24/7, a fully-equipped gourmet kitchen, and an exclusive jacuzzi with panoramic city views.', images: ['https://picsum.photos/seed/room502/700/450'], availableCount: 1, totalCount: 2 },
  { id: 503, hotelId: 5, name: 'Superior Room', type: 'standard', capacity: { adults: 2, children: 0 }, size: 32, bedType: 'Queen', price: 220, originalPrice: 260, amenities: ['ac', 'tv', 'wifi', 'safe', 'city-view'], description: 'Smart, stylish, and fully-equipped, our Superior Rooms offer the complete Makati experience at excellent value.', images: ['https://picsum.photos/seed/room503/700/450'], availableCount: 8, totalCount: 30 },
  // Hotel 6 - Siargao Surf
  { id: 601, hotelId: 6, name: 'Surf Bungalow', type: 'standard', capacity: { adults: 2, children: 0 }, size: 22, bedType: 'Queen', price: 90, originalPrice: 110, amenities: ['ac', 'tv', 'wifi', 'outdoor-shower', 'surf-storage'], description: 'Cool bamboo bungalows steps from the ocean. Store your boards in the dedicated surf locker and wake up before dawn for epic sets at Cloud 9.', images: ['https://picsum.photos/seed/room601/700/450'], availableCount: 5, totalCount: 10 },
  { id: 602, hotelId: 6, name: 'Beachfront Loft', type: 'deluxe', capacity: { adults: 2, children: 1 }, size: 38, bedType: 'King', price: 150, originalPrice: 180, amenities: ['ac', 'tv', 'wifi', 'safe', 'sea-view', 'loft', 'surf-storage', 'hammock'], description: 'A gorgeous open-plan loft with mezzanine sleeping area, a private hammock deck, and some of the best surf views on the island.', images: ['https://picsum.photos/seed/room602/700/450'], availableCount: 3, totalCount: 6 },
  // Hotel 7 - Bohol Heritage
  { id: 701, hotelId: 7, name: 'Heritage Room', type: 'standard', capacity: { adults: 2, children: 1 }, size: 25, bedType: 'Double', price: 110, originalPrice: 130, amenities: ['ac', 'tv', 'wifi', 'garden-view', 'heritage-decor'], description: 'Individually designed rooms with antique furnishings, local artworks, and modern comforts in a beautifully restored heritage building.', images: ['https://picsum.photos/seed/room701/700/450'], availableCount: 8, totalCount: 12 },
  { id: 702, hotelId: 7, name: 'Deluxe Sea View', type: 'deluxe', capacity: { adults: 2, children: 1 }, size: 35, bedType: 'King', price: 170, originalPrice: 200, amenities: ['ac', 'tv', 'wifi', 'safe', 'sea-view', 'balcony', 'bathtub'], description: 'Our premium rooms with sweeping sea views, private balconies, and luxurious bathtubs overlooking Alona Beach.', images: ['https://picsum.photos/seed/room702/700/450'], availableCount: 4, totalCount: 8 },
  // Hotel 8 - Davao Garden
  { id: 801, hotelId: 8, name: 'Garden View Room', type: 'standard', capacity: { adults: 2, children: 1 }, size: 28, bedType: 'Queen', price: 100, originalPrice: 120, amenities: ['ac', 'tv', 'wifi', 'safe', 'garden-view'], description: 'Comfortable, modern rooms overlooking our award-winning tropical gardens, with all the amenities for a restful stay.', images: ['https://picsum.photos/seed/room801/700/450'], availableCount: 10, totalCount: 20 },
  { id: 802, hotelId: 8, name: 'Premium Suite', type: 'suite', capacity: { adults: 2, children: 2 }, size: 60, bedType: 'King + Sofa', price: 180, originalPrice: 220, amenities: ['ac', 'tv', 'minibar', 'wifi', 'safe', 'garden-view', 'living-room', 'bathtub'], description: 'Spacious suites with separate living areas, premium furnishings, and lush garden vistas in the heart of the city.', images: ['https://picsum.photos/seed/room802/700/450'], availableCount: 4, totalCount: 8 }
];

const DEMO_BOOKINGS = [
  {
    id: 'BK202405001', userId: 1, hotelId: 1, roomId: 101,
    checkIn: '2025-07-10', checkOut: '2025-07-14', nights: 4, guests: { adults: 2, children: 0 },
    guestInfo: { firstName: 'Alex', lastName: 'Rivera', email: 'customer@example.com', phone: '+1 555-0101', specialRequests: 'High floor room preferred' },
    addOns: [{ id: 'breakfast', name: 'Breakfast Included', price: 30 }, { id: 'airport', name: 'Airport Transfer', price: 40 }],
    promoCode: 'SUMMER10', promoDiscount: 25,
    subtotal: 1000, addOnsTotal: 70, discount: 25, taxes: 125.4, totalAmount: 1170.4,
    paymentMethod: 'credit_card', paymentStatus: 'paid', status: 'confirmed',
    createdAt: '2025-05-15', updatedAt: '2025-05-15'
  },
  {
    id: 'BK202403002', userId: 1, hotelId: 3, roomId: 301,
    checkIn: '2025-04-20', checkOut: '2025-04-23', nights: 3, guests: { adults: 2, children: 1 },
    guestInfo: { firstName: 'Alex', lastName: 'Rivera', email: 'customer@example.com', phone: '+1 555-0101', specialRequests: '' },
    addOns: [{ id: 'breakfast', name: 'Breakfast Included', price: 30 }],
    promoCode: null, promoDiscount: 0,
    subtotal: 540, addOnsTotal: 30, discount: 0, taxes: 68.4, totalAmount: 638.4,
    paymentMethod: 'paypal', paymentStatus: 'paid', status: 'completed',
    createdAt: '2025-03-20', updatedAt: '2025-04-23'
  },
  {
    id: 'BK202402003', userId: 4, hotelId: 2, roomId: 201,
    checkIn: '2025-06-15', checkOut: '2025-06-20', nights: 5, guests: { adults: 2, children: 0 },
    guestInfo: { firstName: 'James', lastName: 'Park', email: 'james@example.com', phone: '+1 555-0202', specialRequests: 'Honeymoon setup' },
    addOns: [{ id: 'breakfast', name: 'Breakfast Included', price: 35 }],
    promoCode: null, promoDiscount: 0,
    subtotal: 2100, addOnsTotal: 35, discount: 0, taxes: 256.2, totalAmount: 2391.2,
    paymentMethod: 'credit_card', paymentStatus: 'paid', status: 'confirmed',
    createdAt: '2025-05-01', updatedAt: '2025-05-01'
  },
  {
    id: 'BK202401004', userId: 5, hotelId: 5, roomId: 501,
    checkIn: '2025-06-08', checkOut: '2025-06-10', nights: 2, guests: { adults: 1, children: 0 },
    guestInfo: { firstName: 'Linda', lastName: 'Chen', email: 'linda@example.com', phone: '+1 555-0303', specialRequests: '' },
    addOns: [],
    promoCode: null, promoDiscount: 0,
    subtotal: 560, addOnsTotal: 0, discount: 0, taxes: 67.2, totalAmount: 627.2,
    paymentMethod: 'gcash', paymentStatus: 'paid', status: 'checked-in',
    createdAt: '2025-05-20', updatedAt: '2025-06-08'
  },
  {
    id: 'BK202401005', userId: 1, hotelId: 4, roomId: 401,
    checkIn: '2025-03-01', checkOut: '2025-03-05', nights: 4, guests: { adults: 2, children: 0 },
    guestInfo: { firstName: 'Alex', lastName: 'Rivera', email: 'customer@example.com', phone: '+1 555-0101', specialRequests: '' },
    addOns: [{ id: 'breakfast', name: 'Breakfast Included', price: 25 }],
    promoCode: null, promoDiscount: 0,
    subtotal: 800, addOnsTotal: 25, discount: 0, taxes: 99, totalAmount: 924,
    paymentMethod: 'credit_card', paymentStatus: 'paid', status: 'cancelled',
    createdAt: '2025-02-10', updatedAt: '2025-02-15'
  }
];

const DEMO_REVIEWS = [
  { id: 1, userId: 1, hotelId: 1, bookingId: 'BK202403002_fake', userName: 'Alex Rivera', userAvatar: null, rating: 5, title: 'Absolutely breathtaking experience!', comment: 'Grand Laguna Resort exceeded every expectation. The beachfront location is unbeatable, the staff went above and beyond, and the breakfast buffet was outstanding. We will definitely be back!', categories: { location: 5, cleanliness: 5, service: 5, value: 4, facilities: 5 }, response: 'Thank you so much, Alex! We are so glad you enjoyed your stay and look forward to welcoming you back to paradise!', responseDate: '2025-05-01', createdAt: '2025-04-25', status: 'approved' },
  { id: 2, userId: 4, hotelId: 1, bookingId: null, userName: 'James Park', userAvatar: null, rating: 5, title: 'Best resort in Boracay, hands down', comment: 'The Ocean View Suite was absolutely stunning. Floor-to-ceiling windows, a jacuzzi on the terrace, and the sound of waves to fall asleep to. The spa was world-class. Could not have asked for a better honeymoon.', categories: { location: 5, cleanliness: 5, service: 5, value: 4, facilities: 5 }, response: null, responseDate: null, createdAt: '2025-03-12', status: 'approved' },
  { id: 3, userId: 5, hotelId: 1, bookingId: null, userName: 'Linda Chen', userAvatar: null, rating: 4, title: 'Wonderful stay, minor room for improvement', comment: 'The resort is beautiful and the staff are incredibly friendly. My only suggestion would be faster room service, but overall a fantastic experience. The sunset views are jaw-dropping!', categories: { location: 5, cleanliness: 4, service: 4, value: 4, facilities: 4 }, response: 'Thank you Linda! We appreciate your honest feedback and are always working to improve our service.', responseDate: '2025-02-10', createdAt: '2025-02-05', status: 'approved' },
  { id: 4, userId: 1, hotelId: 3, bookingId: 'BK202403002', userName: 'Alex Rivera', userAvatar: null, rating: 5, title: 'Perfect mountain getaway', comment: 'Royal Summit Hotel has the most incredible views of Taal Volcano. Waking up to that view every morning was magical. The fireplace in the Highland Suite made our romantic weekend perfect.', categories: { location: 5, cleanliness: 5, service: 4, value: 5, facilities: 4 }, response: null, responseDate: null, createdAt: '2025-04-26', status: 'approved' },
  { id: 5, userId: 4, hotelId: 2, bookingId: null, userName: 'James Park', userAvatar: null, rating: 5, title: 'The Overwater Bungalow is a dream come true', comment: 'Staying in the Overwater Bungalow at Azure Paradise was the most unique accommodation I\'ve ever experienced. Looking through the glass floor at tropical fish, watching the sun set over the karsts — truly magical.', categories: { location: 5, cleanliness: 5, service: 5, value: 4, facilities: 5 }, response: 'Thank you for choosing us for your special trip, James! The Bacuit Archipelago is indeed magical and we hope to see you again!', responseDate: '2025-04-02', createdAt: '2025-03-28', status: 'approved' },
  { id: 6, userId: 5, hotelId: 5, bookingId: null, userName: 'Linda Chen', userAvatar: null, rating: 4, title: 'Excellent business hotel', comment: 'Clean, modern, and perfectly located in Makati. The rooftop pool was a highlight after long days of meetings. Would definitely stay here again for business trips.', categories: { location: 5, cleanliness: 5, service: 4, value: 3, facilities: 4 }, response: null, responseDate: null, createdAt: '2025-04-15', status: 'approved' }
];

const PROMO_CODES = [
  { code: 'SUMMER10', discount: 10, type: 'percent', description: '10% Summer Discount', minAmount: 200 },
  { code: 'WELCOME20', discount: 20, type: 'percent', description: '20% Welcome Offer', minAmount: 150 },
  { code: 'FLAT50', discount: 50, type: 'fixed', description: '$50 Off Any Booking', minAmount: 300 },
  { code: 'STAY3', discount: 15, type: 'percent', description: '15% Off 3+ Night Stays', minAmount: 100 }
];

// ============================================================
// INIT DEMO DATA
// ============================================================

function initDemoData(force = false) {
  if (!force && DB.get(DB.KEYS.INITIALIZED)) return;

  DB.set(DB.KEYS.USERS, DEMO_USERS);
  DB.set(DB.KEYS.HOTELS, DEMO_HOTELS);
  DB.set(DB.KEYS.ROOMS, DEMO_ROOMS);
  DB.set(DB.KEYS.BOOKINGS, DEMO_BOOKINGS);
  DB.set(DB.KEYS.REVIEWS, DEMO_REVIEWS);
  DB.set(DB.KEYS.WISHLIST, {
    1: [2, 5],
    4: [1, 3],
    5: [1, 2, 4]
  });
  DB.set(DB.KEYS.INQUIRIES, []);
  DB.set(DB.KEYS.INITIALIZED, true);
}

function resetDemoData() {
  const currentUser = DB.get(DB.KEYS.CURRENT_USER);
  Object.values(DB.KEYS).forEach(k => {
    if (k !== DB.KEYS.CURRENT_USER) localStorage.removeItem(k);
  });
  initDemoData(true);
  if (currentUser) DB.set(DB.KEYS.CURRENT_USER, currentUser);
  showToast('Demo data has been reset to defaults.', 'success');
}

// Run on load
initDemoData();
