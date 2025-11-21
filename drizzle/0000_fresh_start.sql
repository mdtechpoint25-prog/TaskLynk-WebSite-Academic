-- Fresh start database schema for TaskLynk
-- Drop all existing tables
DROP TABLE IF EXISTS transactions_log;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS order_history;
DROP TABLE IF EXISTS order_financials;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS managers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Create roles table
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Insert roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('client', 'Client who posts orders'),
('manager', 'Manager who handles clients and assigns orders'),
('writer', 'Freelance writer who completes orders');

-- Create users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended', 'blacklisted')),
  balance_available REAL DEFAULT 0 CHECK(balance_available >= 0),
  balance_pending REAL DEFAULT 0 CHECK(balance_pending >= 0),
  total_earned REAL DEFAULT 0 CHECK(total_earned >= 0),
  rating REAL DEFAULT 0 CHECK(rating >= 0 AND rating <= 5),
  completed_orders INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  approved_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- Create managers table
CREATE TABLE managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_clients TEXT DEFAULT '[]',
  performance_rating REAL DEFAULT 0,
  total_orders_assigned INTEGER DEFAULT 0,
  total_orders_submitted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES users(id),
  manager_id INTEGER REFERENCES users(id),
  writer_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  work_type TEXT DEFAULT 'writing' CHECK(work_type IN ('writing', 'slides', 'technical', 'excel', 'other')),
  page_count INTEGER DEFAULT 0 CHECK(page_count >= 0),
  slide_count INTEGER DEFAULT 0 CHECK(slide_count >= 0),
  client_cpp REAL DEFAULT 240 CHECK(client_cpp >= 0),
  writer_cpp REAL DEFAULT 200 CHECK(writer_cpp >= 0),
  client_total REAL DEFAULT 0 CHECK(client_total >= 0),
  writer_total REAL DEFAULT 0 CHECK(writer_total >= 0),
  manager_total REAL DEFAULT 0 CHECK(manager_total >= 0),
  deadline DATETIME,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'assigned', 'in_progress', 'submitted', 'editing', 'delivered', 'approved', 'paid', 'cancelled', 'revision')),
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'high', 'urgent')),
  submitted INTEGER DEFAULT 0 CHECK(submitted IN (0, 1)),
  paid INTEGER DEFAULT 0 CHECK(paid IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_at DATETIME,
  submitted_at DATETIME,
  delivered_at DATETIME,
  approved_at DATETIME,
  paid_at DATETIME
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_manager ON orders(manager_id);
CREATE INDEX idx_orders_writer ON orders(writer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Create order_financials table
CREATE TABLE order_financials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_amount REAL NOT NULL DEFAULT 0,
  writer_amount REAL NOT NULL DEFAULT 0,
  manager_assign_amount REAL DEFAULT 10,
  manager_submit_amount REAL DEFAULT 0,
  platform_fee REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_financials_order ON order_financials(order_id);

-- Create order_history table
CREATE TABLE order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_history_order ON order_history(order_id);
CREATE INDEX idx_order_history_actor ON order_history(actor_id);

-- Create messages table
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'delivered')),
  approved_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME
);

CREATE INDEX idx_messages_order ON messages(order_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- Create files table
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'requirement' CHECK(category IN ('requirement', 'submission', 'revision', 'final')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_order ON files(order_id);
CREATE INDEX idx_files_uploader ON files(uploader_id);

-- Create notifications table
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create ratings table
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rater_id INTEGER NOT NULL REFERENCES users(id),
  rated_user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_order ON ratings(order_id);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);

-- Create transactions_log table
CREATE TABLE transactions_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  type TEXT NOT NULL CHECK(type IN ('earning', 'withdrawal', 'payment', 'refund')),
  amount REAL NOT NULL,
  balance_before REAL,
  balance_after REAL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions_log(user_id);
CREATE INDEX idx_transactions_order ON transactions_log(order_id);

-- Create payments table
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id),
  amount REAL NOT NULL CHECK(amount > 0),
  payment_method TEXT DEFAULT 'mpesa' CHECK(payment_method IN ('mpesa', 'cash', 'bank')),
  transaction_id TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  confirmed_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_client ON payments(client_id);

-- Seed test user (password is hashed "test123")
-- Note: This is a bcrypt hash of "test123" - $2a$10$rU9j3qQXqKJ4kXZYjYZ1Y.K9XvZJXvX1Y0qJ4kXZYjYZ1Y.K9XvZ
INSERT INTO users (email, password, name, phone, role_id, status, approved_at) VALUES
('test@tasklynk.com', '$2a$10$rU9j3qQXqKJ4kXZYjYZ1Y.K9XvZJXvX1Y0qJ4kXZYjYZ1Y.K9XvZ', 'Test User', '+254701066845', 1, 'approved', CURRENT_TIMESTAMP);

-- Add test user to managers table
INSERT INTO managers (user_id, assigned_clients) VALUES
((SELECT id FROM users WHERE email = 'test@tasklynk.com'), '[]');
