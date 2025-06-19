-- Boulevard API Database Schema

-- Business and Locations
CREATE TABLE IF NOT EXISTS boulevard_businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_locations (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES boulevard_businesses(id),
  name VARCHAR(255) NOT NULL,
  tz VARCHAR(100) NOT NULL DEFAULT 'America/Los_Angeles',
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Categories and Items
CREATE TABLE IF NOT EXISTS boulevard_categories (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES boulevard_locations(id),
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES boulevard_categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  base_duration INTEGER DEFAULT 60, -- minutes
  is_active BOOLEAN DEFAULT true,
  service_type VARCHAR(50) DEFAULT 'bookable', -- bookable, purchasable, gift_card
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff and Staff Variants
CREATE TABLE IF NOT EXISTS boulevard_staff (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES boulevard_locations(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_staff_service_variants (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES boulevard_services(id),
  staff_id INTEGER REFERENCES boulevard_staff(id),
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, staff_id)
);

-- Carts and Cart Items
CREATE TABLE IF NOT EXISTS boulevard_carts (
  id SERIAL PRIMARY KEY,
  cart_uuid VARCHAR(255) UNIQUE NOT NULL,
  location_id INTEGER REFERENCES boulevard_locations(id),
  client_email VARCHAR(255),
  client_first_name VARCHAR(100),
  client_last_name VARCHAR(100),
  client_phone VARCHAR(20),
  payment_info_required BOOLEAN DEFAULT true,
  gift_card_purchase_enabled BOOLEAN DEFAULT true,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_cart_guests (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES boulevard_carts(id),
  guest_uuid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES boulevard_carts(id),
  service_id INTEGER REFERENCES boulevard_services(id),
  staff_variant_id INTEGER REFERENCES boulevard_staff_service_variants(id),
  guest_id INTEGER REFERENCES boulevard_cart_guests(id) NULL,
  base_service_item_id INTEGER REFERENCES boulevard_cart_items(id) NULL, -- for addons
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2),
  duration INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookable Times and Reservations
CREATE TABLE IF NOT EXISTS boulevard_bookable_times (
  id SERIAL PRIMARY KEY,
  time_uuid VARCHAR(255) UNIQUE NOT NULL,
  location_id INTEGER REFERENCES boulevard_locations(id),
  staff_id INTEGER REFERENCES boulevard_staff(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  is_available BOOLEAN DEFAULT true,
  score INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boulevard_cart_reservations (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES boulevard_carts(id),
  bookable_time_id INTEGER REFERENCES boulevard_bookable_times(id),
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(cart_id, bookable_time_id)
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS boulevard_payment_methods (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES boulevard_carts(id),
  method_type VARCHAR(50) NOT NULL, -- card, voucher
  token VARCHAR(255),
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  voucher_service_id INTEGER REFERENCES boulevard_services(id),
  voucher_expires_on DATE,
  voucher_available_count INTEGER,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Ownership Codes
CREATE TABLE IF NOT EXISTS boulevard_cart_ownership_codes (
  id SERIAL PRIMARY KEY,
  code_uuid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  mobile_phone VARCHAR(20),
  code_value VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Addons
CREATE TABLE IF NOT EXISTS boulevard_service_addons (
  id SERIAL PRIMARY KEY,
  base_service_id INTEGER REFERENCES boulevard_services(id),
  addon_service_id INTEGER REFERENCES boulevard_services(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base_service_id, addon_service_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boulevard_carts_uuid ON boulevard_carts(cart_uuid);
CREATE INDEX IF NOT EXISTS idx_boulevard_cart_guests_uuid ON boulevard_cart_guests(guest_uuid);
CREATE INDEX IF NOT EXISTS idx_boulevard_bookable_times_uuid ON boulevard_bookable_times(time_uuid);
CREATE INDEX IF NOT EXISTS idx_boulevard_cart_ownership_codes_uuid ON boulevard_cart_ownership_codes(code_uuid);
CREATE INDEX IF NOT EXISTS idx_boulevard_bookable_times_location_time ON boulevard_bookable_times(location_id, start_time);
CREATE INDEX IF NOT EXISTS idx_boulevard_cart_reservations_expires ON boulevard_cart_reservations(expires_at);
