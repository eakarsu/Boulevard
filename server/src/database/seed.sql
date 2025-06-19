-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'owner@boulevardsalon.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'John', 'Doe', '+1 (555) 123-4567', 'owner'),
('550e8400-e29b-41d4-a716-446655440001', 'emma.wilson@salon.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Emma', 'Wilson', '+1 (555) 111-2222', 'staff'),
('550e8400-e29b-41d4-a716-446655440002', 'james.rodriguez@salon.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'James', 'Rodriguez', '+1 (555) 222-3333', 'staff'),
('550e8400-e29b-41d4-a716-446655440003', 'sofia.martinez@salon.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Sofia', 'Martinez', '+1 (555) 333-4444', 'staff'),
('550e8400-e29b-41d4-a716-446655440004', 'michael.thompson@salon.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Michael', 'Thompson', '+1 (555) 444-5555', 'staff'),
('550e8400-e29b-41d4-a716-446655440005', 'sarah.johnson@email.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Sarah', 'Johnson', '+1 (555) 123-4567', 'client'),
('550e8400-e29b-41d4-a716-446655440006', 'michael.chen@email.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Michael', 'Chen', '+1 (555) 234-5678', 'client'),
('550e8400-e29b-41d4-a716-446655440007', 'lisa.anderson@email.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'Lisa', 'Anderson', '+1 (555) 345-6789', 'client'),
('550e8400-e29b-41d4-a716-446655440008', 'david.wilson@email.com', '$2b$10$rOzJqZxQZ9QZ9QZ9QZ9QZO', 'David', 'Wilson', '+1 (555) 456-7890', 'client');

-- Insert business
INSERT INTO businesses (id, name, description, phone, email, owner_id) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Boulevard Salon & Spa', 'Premier salon and spa offering comprehensive beauty and wellness services', '+1 (555) 123-4567', 'info@boulevardsalon.com', '550e8400-e29b-41d4-a716-446655440000');

-- Insert business address
INSERT INTO business_addresses (business_id, street, city, state, zip_code, country) VALUES
('660e8400-e29b-41d4-a716-446655440000', '123 Main Street', 'New York', 'NY', '10001', 'United States');

-- Insert business settings
INSERT INTO business_settings (business_id, timezone, currency, booking_window_days, cancellation_policy, no_show_policy, require_deposit, deposit_amount, allow_online_booking, auto_confirm_bookings, send_reminders, reminder_times) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'America/New_York', 'USD', 30, '24 hours notice required', 'Charge 50% of service cost', true, 25.00, true, false, true, ARRAY[24, 2]);

-- Insert location
INSERT INTO locations (id, business_id, name, phone, email, capacity) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Main Location', '+1 (555) 123-4567', 'main@boulevardsalon.com', 15);

-- Insert location address
INSERT INTO location_addresses (location_id, street, city, state, zip_code, country) VALUES
('770e8400-e29b-41d4-a716-446655440000', '123 Main Street', 'New York', 'NY', '10001', 'United States');

-- Insert business hours (Monday to Saturday)
INSERT INTO business_hours (location_id, day_of_week, open_time, close_time, is_open) VALUES
('770e8400-e29b-41d4-a716-446655440000', 1, '08:00', '20:00', true), -- Monday
('770e8400-e29b-41d4-a716-446655440000', 2, '08:00', '20:00', true), -- Tuesday
('770e8400-e29b-41d4-a716-446655440000', 3, '08:00', '20:00', true), -- Wednesday
('770e8400-e29b-41d4-a716-446655440000', 4, '08:00', '20:00', true), -- Thursday
('770e8400-e29b-41d4-a716-446655440000', 5, '08:00', '20:00', true), -- Friday
('770e8400-e29b-41d4-a716-446655440000', 6, '09:00', '18:00', true), -- Saturday
('770e8400-e29b-41d4-a716-446655440000', 0, '10:00', '16:00', false); -- Sunday (closed)

-- Insert services
INSERT INTO services (id, business_id, name, description, category, duration_minutes, price, color) VALUES
('880e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Haircut & Style', 'Professional haircut with wash and style', 'Hair', 60, 85.00, '#3B82F6'),
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'Color & Highlights', 'Full color service with highlights', 'Hair', 120, 150.00, '#8B5CF6'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'Beard Trim', 'Professional beard trimming and shaping', 'Grooming', 30, 35.00, '#10B981'),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', 'Deep Conditioning Treatment', 'Intensive hair treatment for damaged hair', 'Hair', 45, 65.00, '#F59E0B'),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', 'Eyebrow Shaping', 'Professional eyebrow shaping and trimming', 'Beauty', 20, 25.00, '#EF4444');

-- Insert staff
INSERT INTO staff (id, business_id, user_id, title, bio, skills, commission_rate, hourly_rate) VALUES
('990e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Senior Hair Stylist', 'Expert stylist with 10+ years experience', ARRAY['Haircuts', 'Color', 'Highlights', 'Styling'], 45.00, 35.00),
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Barber', 'Specialized in mens cuts and grooming', ARRAY['Haircuts', 'Beard Trim', 'Shaving', 'Styling'], 40.00, 30.00),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'Color Specialist', 'Master colorist and balayage expert', ARRAY['Color', 'Highlights', 'Balayage', 'Treatments'], 50.00, 40.00),
('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', 'Junior Stylist', 'Rising talent with fresh techniques', ARRAY['Haircuts', 'Washing', 'Basic Styling'], 35.00, 25.00);

-- Insert staff availability (Monday to Friday, 8 AM to 6 PM)
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
-- Emma Wilson
('990e8400-e29b-41d4-a716-446655440000', 1, '08:00', '18:00', true),
('990e8400-e29b-41d4-a716-446655440000', 2, '08:00', '18:00', true),
('990e8400-e29b-41d4-a716-446655440000', 3, '08:00', '18:00', true),
('990e8400-e29b-41d4-a716-446655440000', 4, '08:00', '18:00', true),
('990e8400-e29b-41d4-a716-446655440000', 5, '08:00', '18:00', true),
-- James Rodriguez
('990e8400-e29b-41d4-a716-446655440001', 1, '09:00', '17:00', true),
('990e8400-e29b-41d4-a716-446655440001', 2, '09:00', '17:00', true),
('990e8400-e29b-41d4-a716-446655440001', 3, '09:00', '17:00', true),
('990e8400-e29b-41d4-a716-446655440001', 4, '09:00', '17:00', true),
('990e8400-e29b-41d4-a716-446655440001', 5, '09:00', '17:00', true),
-- Sofia Martinez
('990e8400-e29b-41d4-a716-446655440002', 1, '10:00', '19:00', true),
('990e8400-e29b-41d4-a716-446655440002', 2, '10:00', '19:00', true),
('990e8400-e29b-41d4-a716-446655440002', 3, '10:00', '19:00', true),
('990e8400-e29b-41d4-a716-446655440002', 4, '10:00', '19:00', true),
('990e8400-e29b-41d4-a716-446655440002', 5, '10:00', '19:00', true);

-- Insert staff services relationships
INSERT INTO staff_services (staff_id, service_id) VALUES
-- Emma Wilson can do haircuts, color, and treatments
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000'),
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440003'),
-- James Rodriguez can do haircuts and beard trims
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000'),
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002'),
-- Sofia Martinez specializes in color services
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003'),
-- Michael Thompson can do basic services
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440000'),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440004');

-- Insert clients
INSERT INTO clients (id, business_id, user_id, first_name, last_name, email, phone, loyalty_points, total_spent, last_visit) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', 150, 1250.00, '2024-01-15 14:00:00+00'),
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006', 'Michael', 'Chen', 'michael.chen@email.com', '+1 (555) 234-5678', 89, 890.00, '2024-01-10 11:30:00+00'),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440007', 'Lisa', 'Anderson', 'lisa.anderson@email.com', '+1 (555) 345-6789', 210, 2100.00, '2024-01-08 16:00:00+00'),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440008', 'David', 'Wilson', 'david.wilson@email.com', '+1 (555) 456-7890', 32, 320.00, '2023-12-20 10:00:00+00');

-- Insert client preferences
INSERT INTO client_preferences (client_id, preferred_staff, notes) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', ARRAY['990e8400-e29b-41d4-a716-446655440000'], 'Prefers Emma as stylist, allergic to sulfates'),
('aa0e8400-e29b-41d4-a716-446655440001', ARRAY['990e8400-e29b-41d4-a716-446655440001'], 'Regular beard trim customer'),
('aa0e8400-e29b-41d4-a716-446655440002', ARRAY['990e8400-e29b-41d4-a716-446655440000'], 'VIP client, books monthly color appointments'),
('aa0e8400-e29b-41d4-a716-446655440003', NULL, 'New client, referred by Sarah Johnson');

-- Insert sample appointments
INSERT INTO appointments (id, business_id, location_id, client_id, staff_id, service_id, start_time, end_time, status, price, payment_status) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '11 hours', 'confirmed', 85.00, 'paid'),
('bb0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '11 hours 30 minutes', CURRENT_DATE + INTERVAL '12 hours', 'in_progress', 35.00, 'pending'),
('bb0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day 14 hours', CURRENT_DATE + INTERVAL '1 day 16 hours', 'scheduled', 150.00, 'pending');

-- Insert sample payments
INSERT INTO payments (appointment_id, amount, method, status) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', 85.00, 'card', 'paid'),
('bb0e8400-e29b-41d4-a716-446655440001', 35.00, 'cash', 'pending');
