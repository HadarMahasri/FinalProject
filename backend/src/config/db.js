const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eventhub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let isConnected = false;

// Test connection on startup
async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    isConnected = true;
    connection.release();
  } catch (error) {
    console.warn('⚠️ MySQL connection failed:', error.message);
    console.warn('📌 Running in Hybrid Memory-Fallback mode. All registration, login, vendor browsing & booking actions will work smoothly!');
    isConnected = false;
  }
}

initDb();

// Persistent Fallback Storage File
const dataDir = path.join(__dirname, '../../data');
const jsonFilePath = path.join(dataDir, 'memory_db.json');

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const defaultMemoryDb = {
  users: [
    { id: 1, name: 'אדמין המערכת', email: 'admin@eventhub.co.il', password_hash: defaultPasswordHash, role: 'admin', phone: '050-0000000', created_at: new Date() },
    { id: 2, name: 'רועי שחר (צלם)', email: 'roey@studioshahar.co.il', password_hash: defaultPasswordHash, role: 'vendor', phone: '052-1234567', created_at: new Date() },
    { id: 3, name: 'DJ דניאל גולן', email: 'daniel@djgolan.co.il', password_hash: defaultPasswordHash, role: 'vendor', phone: '054-9876543', created_at: new Date() },
    { id: 4, name: 'שף דוד פרידמן - קייטרינג', email: 'chef@gourmet.co.il', password_hash: defaultPasswordHash, role: 'vendor', phone: '053-5554433', created_at: new Date() },
    { id: 5, name: 'גני אליסיה - מקום לאירועים', email: 'info@elysia.co.il', password_hash: defaultPasswordHash, role: 'vendor', phone: '050-7778899', created_at: new Date() },
    { id: 6, name: 'מיכל כהן (לקוחה)', email: 'michal@gmail.com', password_hash: defaultPasswordHash, role: 'customer', phone: '054-1112233', created_at: new Date() }
  ],
  vendors: [
    { id: 1, user_id: 2, business_name: 'סטודיו שחר צילום אירועים', category: 'photography', description: 'צילום סטילס ווידאו אומנותי לאירועים מרגשים. ניסיון של 10 שנים בתחום.', location: 'תל אביב והמרכז', starting_price: 4500.00, is_approved: 1, cover_image: null, rating_avg: 4.90, review_count: 18, created_at: new Date() },
    { id: 2, user_id: 3, business_name: 'DJ Daniel Golan - מוזיקה לאירועים', category: 'dj_music', description: 'סטים ייחודיים שמובילים את הרחבה. מוזיקה מותאמת אישית לכל זוג ואירוע.', location: 'מרכז ושרון', starting_price: 3800.00, is_approved: 1, cover_image: null, rating_avg: 4.85, review_count: 24, created_at: new Date() },
    { id: 3, user_id: 4, business_name: 'גורמה פרידמן - קייטרינג שף', category: 'catering', description: 'חוויה קולינרית בלתי נשכחת. תפריט שף בשרי וצמחוני ברמה הגבוהה ביותר.', location: 'ירושלים והסביבה', starting_price: 180.00, is_approved: 1, cover_image: null, rating_avg: 5.00, review_count: 12, created_at: new Date() },
    { id: 4, user_id: 5, business_name: 'גני אליסיה - מתחם אירועים קסום', category: 'venue', description: 'מתחם אירועים יוקרתי בלב הטבע עם גן פתוח ואולם מעוצב לעד 500 אורחים.', location: 'שפלה ודרום', starting_price: 15000.00, is_approved: 1, cover_image: null, rating_avg: 4.95, review_count: 30, created_at: new Date() }
  ],
  events: [
    { id: 1, customer_id: 6, title: 'חתונה של מיכל ויונתן', event_type: 'חתונה', event_date: '2026-09-15', budget: 80000.00, location: 'מרכז', guest_count: 250, notes: 'מחפשים אווירה יוקרתית', created_at: new Date() }
  ],
  bookings: [],
  reviews: [],
  media: []
};

// Load persistent data if exists
function loadMemoryDb() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(jsonFilePath)) {
      const fileData = fs.readFileSync(jsonFilePath, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.warn('Could not read memory_db.json:', err.message);
  }
  return defaultMemoryDb;
}

function saveMemoryDb() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(jsonFilePath, JSON.stringify(memoryDb, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not save memory_db.json:', err.message);
  }
}

const memoryDb = loadMemoryDb();

// Safe query execution wrapper
async function query(sql, params = []) {
  if (isConnected) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      console.warn('MySQL query error, attempting fallback:', err.message);
    }
  }
  
  // Return fallback response for queries if MySQL is not available
  const result = mockExecute(sql, params);
  saveMemoryDb(); // Auto-persist any inserts/updates
  return result;
}

function mockExecute(sql, params) {
  const normalizedSql = sql.trim().toLowerCase();

  // USERS
  if (normalizedSql.includes('users')) {
    if (normalizedSql.includes('insert into users')) {
      const newId = memoryDb.users.length + 1;
      const newUser = {
        id: newId,
        name: params[0],
        email: String(params[1]).trim().toLowerCase(),
        password_hash: params[2],
        role: params[3] || 'customer',
        phone: params[4] || null,
        created_at: new Date()
      };
      memoryDb.users.push(newUser);
      return [{ insertId: newId }];
    }

    if (normalizedSql.includes('email =')) {
      const targetEmail = String(params[0] || '').trim().toLowerCase();
      const user = memoryDb.users.find(u => u.email.toLowerCase() === targetEmail);
      return [[user].filter(Boolean)];
    }

    if (normalizedSql.includes('where id =') || normalizedSql.includes('users.id =')) {
      const targetId = Number(params[0]);
      const user = memoryDb.users.find(u => u.id === targetId);
      return [[user].filter(Boolean)];
    }

    return [memoryDb.users];
  }

  // INSERTS FOR VENDORS
  if (normalizedSql.startsWith('insert into vendors')) {
    const newId = memoryDb.vendors.length + 1;
    const newVendor = {
      id: newId,
      user_id: Number(params[0]),
      business_name: params[1],
      category: params[2],
      description: params[3],
      location: params[4],
      starting_price: Number(params[5]),
      cover_image: params[6] || null,
      is_approved: 1,
      rating_avg: 5.0,
      review_count: 0,
      created_at: new Date()
    };
    memoryDb.vendors.push(newVendor);
    return [{ insertId: newId }];
  }

  // VENDORS SELECT / UPDATE
  if (normalizedSql.includes('vendors')) {
    let list = memoryDb.vendors.map(v => {
      const u = memoryDb.users.find(usr => usr.id === v.user_id) || {};
      return { ...v, owner_name: u.name, email: u.email, phone: u.phone };
    });

    // Query 1: lookup vendor profile by user_id (SELECT * FROM vendors WHERE user_id = ?)
    if (normalizedSql.includes('user_id =')) {
      const targetUserId = Number(params[0]);
      const single = list.find(v => v.user_id === targetUserId);
      return [[single].filter(Boolean)];
    }

    // Query 2: lookup vendor profile by vendor id (WHERE v.id = ? or WHERE id = ?)
    if (normalizedSql.includes('v.id =') || normalizedSql.includes('where id =')) {
      const targetId = Number(params[0]);
      const single = list.find(v => v.id === targetId);
      return [[single].filter(Boolean)];
    }

    // Query 3: list filters
    if (normalizedSql.includes('v.is_approved = false') || params.includes(false)) {
      list = list.filter(v => !v.is_approved);
    } else if (!normalizedSql.includes('where 1=1')) {
      list = list.filter(v => v.is_approved);
    }

    return [list];
  }

  if (normalizedSql.startsWith('update vendors set')) {
    const vendorId = Number(params[params.length - 1]);
    const vendor = memoryDb.vendors.find(v => v.id === vendorId);
    if (vendor) {
      if (sql.includes('business_name')) vendor.business_name = params[0];
      if (sql.includes('starting_price')) vendor.starting_price = Number(params[params.length - 2]);
      if (sql.includes('description')) vendor.description = params[1] || vendor.description;
      if (sql.includes('location')) vendor.location = params[2] || vendor.location;
    }
    return [{ affectedRows: 1 }];
  }

  // MEDIA
  if (normalizedSql.startsWith('insert into media')) {
    const newId = memoryDb.media.length + 1;
    const item = { id: newId, vendor_id: params[0], file_path: params[1], file_type: params[2], created_at: new Date() };
    memoryDb.media.push(item);
    return [{ insertId: newId }];
  }

  if (normalizedSql.startsWith('select * from media where vendor_id =')) {
    const items = memoryDb.media.filter(m => m.vendor_id === Number(params[0]));
    return [items];
  }

  // EVENTS
  if (normalizedSql.startsWith('insert into events')) {
    const newId = memoryDb.events.length + 1;
    const newEvent = {
      id: newId,
      customer_id: params[0],
      title: params[1],
      event_type: params[2],
      event_date: params[3],
      budget: params[4],
      location: params[5],
      guest_count: params[6],
      notes: params[7],
      created_at: new Date()
    };
    memoryDb.events.push(newEvent);
    return [{ insertId: newId }];
  }

  if (normalizedSql.startsWith('select * from events where customer_id =')) {
    const items = memoryDb.events.filter(e => e.customer_id === Number(params[0]));
    return [items];
  }

  if (normalizedSql.startsWith('select * from events where id =')) {
    const item = memoryDb.events.find(e => e.id === Number(params[0]));
    return [[item].filter(Boolean)];
  }

  // BOOKINGS
  if (normalizedSql.startsWith('insert into bookings')) {
    const newId = memoryDb.bookings.length + 1;
    const newBooking = {
      id: newId,
      event_id: params[0],
      vendor_id: params[1],
      notes: params[2],
      agreed_price: params[3],
      status: 'pending',
      created_at: new Date()
    };
    memoryDb.bookings.push(newBooking);
    return [{ insertId: newId }];
  }

  if (normalizedSql.includes('from bookings b')) {
    const list = memoryDb.bookings.map(b => {
      const ev = memoryDb.events.find(e => e.id === b.event_id) || {};
      const ven = memoryDb.vendors.find(v => v.id === b.vendor_id) || {};
      const cust = memoryDb.users.find(u => u.id === ev.customer_id) || {};
      return {
        ...b,
        event_title: ev.title,
        event_type: ev.event_type,
        event_date: ev.event_date,
        business_name: ven.business_name,
        customer_name: cust.name,
        customer_phone: cust.phone,
        customer_email: cust.email
      };
    });
    return [list];
  }

  if (normalizedSql.startsWith('update bookings set status =')) {
    const booking = memoryDb.bookings.find(b => b.id === Number(params[1]));
    if (booking) booking.status = params[0];
    return [{ affectedRows: 1 }];
  }

  // REVIEWS
  if (normalizedSql.startsWith('insert into reviews')) {
    const newId = memoryDb.reviews.length + 1;
    const newReview = { id: newId, booking_id: params[0], customer_id: params[1], vendor_id: params[2], rating: params[3], comment: params[4], created_at: new Date() };
    memoryDb.reviews.push(newReview);
    return [{ insertId: newId }];
  }

  if (normalizedSql.startsWith('select r.*')) {
    const items = memoryDb.reviews.filter(r => r.vendor_id === Number(params[0])).map(r => {
      const cust = memoryDb.users.find(u => u.id === r.customer_id) || {};
      return { ...r, customer_name: cust.name };
    });
    return [items];
  }

  // STATS
  if (normalizedSql.includes('count(*) as total')) {
    let count = 0;
    if (normalizedSql.includes('from users')) count = memoryDb.users.length;
    else if (normalizedSql.includes('from vendors where is_approved = false')) count = memoryDb.vendors.filter(v => !v.is_approved).length;
    else if (normalizedSql.includes('from vendors')) count = memoryDb.vendors.length;
    else if (normalizedSql.includes('from events')) count = memoryDb.events.length;
    else if (normalizedSql.includes('from bookings')) count = memoryDb.bookings.length;
    return [[{ total: count }]];
  }

  return [[]];
}

module.exports = {
  query,
  pool,
  memoryDb,
  saveMemoryDb
};
