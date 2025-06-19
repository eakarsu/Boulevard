-- Boulevard API Sample Data

-- Insert sample business
INSERT INTO boulevard_businesses (id, name)
VALUES (1, 'The Jentleman Salon')
ON CONFLICT (id) DO NOTHING;

-- Insert sample location
INSERT INTO boulevard_locations (id, business_id, name, tz, address_line1, address_city, address_state, address_zip)
VALUES (1, 1, 'Downtown Location', 'America/Los_Angeles', '123 Main St', 'Los Angeles', 'CA', '90210')
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO boulevard_categories (id, location_id, name, sort_order) VALUES
(1, 1, 'Haircuts', 1),
(2, 1, 'Shaves', 2),
(3, 1, 'Nails', 3),
(4, 1, 'Products', 4),
(5, 1, 'Gift Cards', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert sample services
INSERT INTO boulevard_services (id, category_id, name, description, base_price, base_duration, service_type) VALUES
-- Haircuts
(1, 1, 'The Jentleman', 'Premium haircut with consultation', 85.00, 60, 'bookable'),
(2, 1, 'The Buzz Cut', 'Classic buzz cut', 45.00, 30, 'bookable'),
(3, 1, 'The Head Shave', 'Complete head shave', 55.00, 45, 'bookable'),
(4, 1, 'The Razor Fade', 'Precision razor fade', 75.00, 60, 'bookable'),
(5, 1, 'The Clean Up', 'Quick trim and cleanup', 35.00, 30, 'bookable'),
-- Shaves
(6, 2, 'Straight Razor Shave', 'Traditional straight razor shave', 65.00, 45, 'bookable'),
(7, 2, 'Straight Razor Beard Line-Up', 'Beard shaping with straight razor', 45.00, 30, 'bookable'),
(8, 2, 'Beard and Mustache Trim', 'Beard and mustache grooming', 35.00, 30, 'bookable'),
-- Nails
(9, 3, 'The Jentlemanicure', 'Gentleman''s manicure', 55.00, 45, 'bookable'),
(10, 3, 'The Jentleped', 'Gentleman''s pedicure', 65.00, 60, 'bookable'),
-- Products
(11, 4, 'Jentlemanicure Membership', 'Monthly manicure membership', 150.00, 0, 'purchasable'),
(12, 4, 'Straight Razor Shave (3)', 'Package of 3 shaves', 180.00, 0, 'purchasable'),
-- Gift Cards
(13, 5, 'Gift Card', 'Gift card for services', 0.00, 0, 'gift_card')
ON CONFLICT (id) DO NOTHING;

-- Insert sample staff
INSERT INTO boulevard_staff (id, location_id, first_name, last_name, bio) VALUES
(1, 1, 'Marcus', 'Johnson', 'Master barber with 15 years of experience specializing in classic cuts and straight razor shaves.'),
(2, 1, 'David', 'Chen', 'Expert in modern styling and beard grooming. Passionate about creating the perfect look for each client.'),
(3, 1, 'Sarah', 'Williams', 'Nail specialist and grooming expert. Dedicated to providing relaxing and professional nail care.')
ON CONFLICT (id) DO NOTHING;

-- Insert staff service variants
INSERT INTO boulevard_staff_service_variants (service_id, staff_id, price, duration) VALUES
-- Marcus - Haircuts and Shaves
(1, 1, 95.00, 60),  -- The Jentleman
(2, 1, 50.00, 30),  -- The Buzz Cut
(3, 1, 60.00, 45),  -- The Head Shave
(4, 1, 85.00, 60),  -- The Razor Fade
(5, 1, 40.00, 30),  -- The Clean Up
(6, 1, 75.00, 45),  -- Straight Razor Shave
(7, 1, 50.00, 30),  -- Straight Razor Beard Line-Up
(8, 1, 40.00, 30),  -- Beard and Mustache Trim
-- David - Haircuts and Shaves
(1, 2, 85.00, 60),  -- The Jentleman
(2, 2, 45.00, 30),  -- The Buzz Cut
(4, 2, 75.00, 60),  -- The Razor Fade
(5, 2, 35.00, 30),  -- The Clean Up
(8, 2, 35.00, 30),  -- Beard and Mustache Trim
-- Sarah - Nails
(9, 3, 55.00, 45),  -- The Jentlemanicure
(10, 3, 65.00, 60)  -- The Jentleped
ON CONFLICT (service_id, staff_id) DO NOTHING;

-- Insert sample bookable times (next 30 days, 9 AM to 6 PM, excluding weekends)
INSERT INTO boulevard_bookable_times (time_uuid, location_id, staff_id, start_time, end_time, is_available, score)
SELECT
  gen_random_uuid()::text,
  1,
  staff_id,
  date_time,
  date_time + interval '1 hour',
  true,
  100
FROM (
  SELECT
    generate_series(
      date_trunc('day', CURRENT_DATE) + interval '9 hours',
      date_trunc('day', CURRENT_DATE + interval '30 days') + interval '18 hours',
      interval '1 hour'
    ) as date_time,
    generate_series(1, 3) as staff_id
) times
WHERE extract(dow from date_time) NOT IN (0, 6) -- Exclude weekends
ON CONFLICT (time_uuid) DO NOTHING;

