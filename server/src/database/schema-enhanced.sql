-- Boulevard Enhanced Database Schema
-- Adds all missing features: recurring appointments, notifications, payments, calendar sync, analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES (Enhanced)
-- =====================================================

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'client')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    google_calendar_token TEXT,
    google_calendar_refresh_token TEXT,
    google_calendar_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Businesses table (enhanced)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_account_id VARCHAR(255),
    stripe_publishable_key VARCHAR(255),
    twilio_account_sid VARCHAR(255),
    twilio_auth_token VARCHAR(255),
    twilio_phone_number VARCHAR(20),
    sendgrid_api_key VARCHAR(255),
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business settings (enhanced)
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    booking_window_days INTEGER DEFAULT 30,
    cancellation_policy TEXT DEFAULT '24 hours notice required',
    no_show_policy TEXT DEFAULT 'Charge 50% of service cost',
    require_deposit BOOLEAN DEFAULT true,
    deposit_amount DECIMAL(10,2) DEFAULT 25.00,
    deposit_percentage DECIMAL(5,2) DEFAULT 20.00,
    allow_online_booking BOOLEAN DEFAULT true,
    auto_confirm_bookings BOOLEAN DEFAULT false,
    send_reminders BOOLEAN DEFAULT true,
    reminder_hours INTEGER[] DEFAULT ARRAY[24, 2],
    sms_notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT true,
    buffer_time_minutes INTEGER DEFAULT 15,
    max_advance_booking_days INTEGER DEFAULT 90,
    min_advance_booking_hours INTEGER DEFAULT 2,
    allow_recurring_bookings BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVICE CATALOG MANAGEMENT
-- =====================================================

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'scissors',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services table (enhanced)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    color VARCHAR(7) DEFAULT '#3B82F6',
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_bookable_online BOOLEAN DEFAULT true,
    max_concurrent_bookings INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service add-ons
CREATE TABLE IF NOT EXISTS service_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STAFF AVAILABILITY & SCHEDULING
-- =====================================================

-- Staff table (enhanced)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    bio TEXT,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    commission_rate DECIMAL(5,2) DEFAULT 40.00,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    accepts_online_bookings BOOLEAN DEFAULT true,
    google_calendar_id VARCHAR(255),
    google_calendar_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, user_id)
);

-- Staff regular availability (weekly schedule)
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff breaks (regular breaks in schedule)
CREATE TABLE IF NOT EXISTS staff_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    name VARCHAR(100) DEFAULT 'Break',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff time off (vacation, sick days, etc.)
CREATE TABLE IF NOT EXISTS staff_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_full_day BOOLEAN DEFAULT true,
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff schedule overrides (specific date/time changes)
CREATE TABLE IF NOT EXISTS staff_schedule_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT false,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff services (many-to-many with pricing)
CREATE TABLE IF NOT EXISTS staff_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2),
    custom_duration INTEGER,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, service_id)
);

-- =====================================================
-- CLIENTS (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_visit TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    sms_opt_in BOOLEAN DEFAULT true,
    email_opt_in BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client preferences
CREATE TABLE IF NOT EXISTS client_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    preferred_staff UUID[] DEFAULT ARRAY[]::UUID[],
    preferred_services UUID[] DEFAULT ARRAY[]::UUID[],
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    reminder_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- APPOINTMENTS & RECURRING APPOINTMENTS
-- =====================================================

-- Recurring appointment series
CREATE TABLE IF NOT EXISTS recurring_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
    day_of_week INTEGER,
    day_of_month INTEGER,
    interval_value INTEGER DEFAULT 1,
    preferred_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INTEGER,
    occurrences_created INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table (enhanced)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    recurring_series_id UUID REFERENCES recurring_series(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    internal_notes TEXT,
    price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT false,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'refunded', 'failed')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reminders_sent TEXT[] DEFAULT ARRAY[]::TEXT[],
    google_calendar_event_id VARCHAR(255),
    source VARCHAR(20) DEFAULT 'admin' CHECK (source IN ('admin', 'online', 'recurring', 'google_calendar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointment add-ons
CREATE TABLE IF NOT EXISTS appointment_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES service_addons(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'appointment_rescheduled', 'no_show', 'review_request', 'custom')),
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification log
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    external_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENTS (Stripe Integration)
-- =====================================================

-- Payments table (enhanced)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    tip DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'card', 'gift_card', 'loyalty_points', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    stripe_refund_id VARCHAR(255),
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    receipt_url VARCHAR(500),
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods (stored cards)
CREATE TABLE IF NOT EXISTS client_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'card',
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GOOGLE CALENDAR SYNC
-- =====================================================

-- Calendar sync status
CREATE TABLE IF NOT EXISTS calendar_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    google_calendar_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_token VARCHAR(500),
    is_enabled BOOLEAN DEFAULT true,
    sync_direction VARCHAR(20) DEFAULT 'both' CHECK (sync_direction IN ('to_google', 'from_google', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- External calendar events (blocked time from Google Calendar)
CREATE TABLE IF NOT EXISTS external_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, google_event_id)
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

-- Daily business metrics (aggregated)
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    new_clients INTEGER DEFAULT 0,
    returning_clients INTEGER DEFAULT 0,
    average_service_value DECIMAL(10,2) DEFAULT 0,
    total_tips DECIMAL(10,2) DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, date)
);

-- Staff daily metrics
CREATE TABLE IF NOT EXISTS staff_daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    utilization_rate DECIMAL(5,2) DEFAULT 0,
    total_tips DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, date)
);

-- Service performance metrics
CREATE TABLE IF NOT EXISTS service_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bookings_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_price DECIMAL(10,2) DEFAULT 0,
    cancellation_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, date)
);

-- Client reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    response TEXT,
    response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    capacity INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS location_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business hours
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

-- The base schema predates these enhanced relationships. CREATE TABLE IF NOT
-- EXISTS does not add columns to an existing table, so apply them explicitly.
ALTER TABLE services
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS recurring_series_id UUID REFERENCES recurring_series(id) ON DELETE SET NULL;
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_series_id ON appointments(recurring_series_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_business_id ON recurring_series(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_business_id ON notification_log(business_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_appointment_id ON notification_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_business_date ON daily_metrics(business_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_daily_metrics_staff_date ON staff_daily_metrics(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_dates ON staff_time_off(staff_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_external_calendar_events_times ON external_calendar_events(staff_id, start_time, end_time);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ language 'plpgsql';
