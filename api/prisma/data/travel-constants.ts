export const VACATION_CATEGORIES = [
  { slug: 'beach', name: 'Beach Holidays', nameRu: 'Пляжный отдых', description: 'Sun, sea and sand resorts worldwide', icon: 'Umbrella', sortOrder: 1 },
  { slug: 'ski', name: 'Ski & Winter', nameRu: 'Горнолыжный отдых', description: 'Alpine slopes and winter sports', icon: 'Mountain', sortOrder: 2 },
  { slug: 'city-break', name: 'City Breaks', nameRu: 'Городские туры', description: 'Weekend escapes to vibrant cities', icon: 'Building2', sortOrder: 3 },
  { slug: 'cultural', name: 'Cultural Tours', nameRu: 'Культурный туризм', description: 'Museums, heritage and local traditions', icon: 'Landmark', sortOrder: 4 },
  { slug: 'adventure', name: 'Adventure', nameRu: 'Приключения', description: 'Hiking, rafting and outdoor thrills', icon: 'Compass', sortOrder: 5 },
  { slug: 'family', name: 'Family Holidays', nameRu: 'Семейный отдых', description: 'Kid-friendly resorts and activities', icon: 'Users', sortOrder: 6 },
  { slug: 'luxury', name: 'Luxury Travel', nameRu: 'Люкс', description: 'Five-star resorts and premium service', icon: 'Gem', sortOrder: 7 },
  { slug: 'wellness', name: 'Wellness & Spa', nameRu: 'SPA и wellness', description: 'Relaxation, thermal baths and retreats', icon: 'Heart', sortOrder: 8 },
  { slug: 'eco', name: 'Eco Tourism', nameRu: 'Экотourism', description: 'Sustainable nature experiences', icon: 'Leaf', sortOrder: 9 },
  { slug: 'safari', name: 'Safari', nameRu: 'Сафари', description: 'Wildlife adventures in Africa and beyond', icon: 'Binoculars', sortOrder: 10 },
  { slug: 'cruise', name: 'Cruises', nameRu: 'Круизы', description: 'Ocean and river cruise packages', icon: 'Ship', sortOrder: 11 },
  { slug: 'gastronomy', name: 'Gastronomy', nameRu: 'Гастрономический', description: 'Food and wine tours', icon: 'Utensils', sortOrder: 12 },
  { slug: 'honeymoon', name: 'Honeymoon', nameRu: 'Медовый месяц', description: 'Romantic getaways for couples', icon: 'HeartHandshake', sortOrder: 13 },
  { slug: 'pilgrimage', name: 'Pilgrimage', nameRu: 'Паломничество', description: 'Sacred sites and spiritual journeys', icon: 'Church', sortOrder: 14 },
  { slug: 'business', name: 'Business Travel', nameRu: 'Деловой туризм', description: 'Corporate trips and MICE events', icon: 'Briefcase', sortOrder: 15 },
];

export const ROOM_TYPES = [
  'Standard',
  'Superior',
  'Deluxe',
  'Suite',
  'Family Room',
  'Studio',
  'Junior Suite',
  'Presidential Suite',
  'Connecting Room',
  'Accessible Room',
];

export const BEACH_TYPES = [
  'Sandy',
  'White Sand',
  'Golden Sand',
  'Pebble',
  'Rocky',
  'Coral',
  'Black Sand',
  'Mixed',
  'Private Beach',
  'Urban Beach',
  'Lagoon',
  'None',
];

export const RESORT_TYPES = ['beach', 'ski', 'spa', 'mountain', 'lake', 'desert', 'island', 'thermal'];

export const AIRLINES = [
  'Emirates', 'Qatar Airways', 'Turkish Airlines', 'Lufthansa', 'Air France', 'KLM',
  'British Airways', 'Singapore Airlines', 'Etihad Airways', 'Air Astana', 'SCAT Airlines',
  'FlyArystan', 'Pegasus Airlines', 'Ryanair', 'easyJet', 'Wizz Air', 'AirAsia',
  'Cathay Pacific', 'ANA', 'JAL', 'Korean Air', 'Thai Airways', 'Vietnam Airlines',
  'Aeroflot', 'S7 Airlines', 'Uzbekistan Airways', 'Air Arabia', 'Gulf Air',
];

export const HOTEL_BRANDS = [
  'Grand', 'Royal', 'Park', 'Plaza', 'Palace', 'Garden', 'Sunrise', 'Ocean', 'Alpine',
  'Metropolitan', 'Heritage', 'Boutique', 'Residence', 'Suites', 'Inn', 'Lodge', 'Resort',
];

export const HOTEL_SUFFIXES = ['Hotel', 'Resort & Spa', 'Suites', 'Inn', 'Lodge', 'Grand Hotel'];

export const AMENITIES = [
  'Wi-Fi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Parking', 'Room Service',
  'Air Conditioning', 'Breakfast', 'Family Friendly', 'Luxury', 'Transfer Included', 'Beach Access',
];
export const FREEBIES = ['Free Wi-Fi', 'Free Breakfast', 'Free Parking', 'Free Airport Shuttle'];
export const MEAL_PLANS = ['All Inclusive', 'Half Board', 'Full Board', 'Breakfast Only', 'Room Only'];

export const TOUR_PREFIXES = [
  'Discover', 'Explore', 'Classic', 'Premium', 'Ultimate', 'Hidden Gems of', 'Best of', 'Grand Tour of',
];

export const TOUR_SUFFIXES = [
  'Experience', 'Adventure', 'Getaway', 'Discovery', 'Expedition', 'Journey', 'Escape',
];

export const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
  'https://images.unsplash.com/photo-1544551763-77aef685f7a5?w=800',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
];

export const CITY_SUFFIXES = ['ville', 'burg', 'ton', 'ford', 'port', 'berg', 'stad', 'haven', 'field', 'wood'];
export const CITY_PREFIXES = ['New', 'Old', 'North', 'South', 'East', 'West', 'Lake', 'Mount', 'Green', 'Blue', 'Golden', 'Silver'];

export const KNOWN_IATA: Record<string, string> = {
  'New York': 'JFK', 'London': 'LHR', 'Paris': 'CDG', 'Tokyo': 'NRT', 'Dubai': 'DXB',
  'Istanbul': 'IST', 'Frankfurt': 'FRA', 'Singapore': 'SIN', 'Bangkok': 'BKK', 'Sydney': 'SYD',
  'Los Angeles': 'LAX', 'Chicago': 'ORD', 'Moscow': 'SVO', 'Beijing': 'PEK', 'Shanghai': 'PVG',
  'Hong Kong': 'HKG', 'Seoul': 'ICN', 'Delhi': 'DEL', 'Mumbai': 'BOM', 'Cairo': 'CAI',
  'Johannesburg': 'JNB', 'Nairobi': 'NBO', 'Almaty': 'ALA', 'Astana': 'NQZ', 'Tashkent': 'TAS',
  'Baku': 'GYD', 'Tbilisi': 'TBS', 'Antalya': 'AYT', 'Barcelona': 'BCN', 'Rome': 'FCO',
  'Madrid': 'MAD', 'Amsterdam': 'AMS', 'Berlin': 'BER', 'Vienna': 'VIE', 'Prague': 'PRG',
  'Warsaw': 'WAW', 'Athens': 'ATH', 'Lisbon': 'LIS', 'Dublin': 'DUB', 'Oslo': 'OSL',
  'Stockholm': 'ARN', 'Helsinki': 'HEL', 'Copenhagen': 'CPH', 'Brussels': 'BRU', 'Zurich': 'ZRH',
  'Geneva': 'GVA', 'Milan': 'MXP', 'Munich': 'MUC', 'Toronto': 'YYZ', 'Vancouver': 'YVR',
  'Mexico City': 'MEX', 'São Paulo': 'GRU', 'Buenos Aires': 'EZE', 'Lima': 'LIM', 'Bogotá': 'BOG',
  'Miami': 'MIA', 'San Francisco': 'SFO', 'Las Vegas': 'LAS', 'Orlando': 'MCO', 'Boston': 'BOS',
  'Washington': 'IAD', 'Seattle': 'SEA', 'Doha': 'DOH', 'Abu Dhabi': 'AUH', 'Riyadh': 'RUH',
  'Jeddah': 'JED', 'Kuwait City': 'KWI', 'Manila': 'MNL', 'Jakarta': 'CGK', 'Kuala Lumpur': 'KUL',
  'Ho Chi Minh City': 'SGN', 'Hanoi': 'HAN', 'Phuket': 'HKT', 'Bali': 'DPS', 'Maldives': 'MLE',
  'Marrakech': 'RAK', 'Casablanca': 'CMN', 'Cape Town': 'CPT', 'Auckland': 'AKL', 'Melbourne': 'MEL',
  'Perth': 'PER', 'Brisbane': 'BNE', 'Reykjavik': 'KEF', 'Budapest': 'BUD', 'Bucharest': 'OTP',
  'Sofia': 'SOF', 'Belgrade': 'BEG', 'Zagreb': 'ZAG', 'Kyiv': 'KBP', 'Minsk': 'MSQ',
  'Yerevan': 'EVN', 'Tehran': 'IKA', 'Baghdad': 'BGW', 'Amman': 'AMM', 'Beirut': 'BEY',
  'Tel Aviv': 'TLV', 'Muscat': 'MCT', 'Colombo': 'CMB', 'Kathmandu': 'KTM', 'Dhaka': 'DAC',
  'Karachi': 'KHI', 'Lahore': 'LHE', 'Islamabad': 'ISB', 'Ulaanbaatar': 'UBN', 'Phnom Penh': 'PNH',
};
