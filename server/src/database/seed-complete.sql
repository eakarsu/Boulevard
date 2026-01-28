-- Complete seed data for Boulevard Clone
-- Ensures at least 15 items for each feature

-- Business ID: 22222222-2222-2222-2222-222222222222
-- Location IDs: 44444444-4444-4444-4444-44444444444[1-3]
-- Service IDs: 66666666-6666-6666-6666-6666666666[01-20]
-- Staff IDs: 77777777-7777-7777-7777-77777777777[1-8]
-- Client IDs: 88888888-8888-8888-8888-8888888888[01-20]
-- Appointment IDs: 99999999-9999-9999-9999-9999999999[01-16]

-- ================================================================
-- 1. Additional Service Categories (need 15 total, have 5)
-- ================================================================
INSERT INTO service_categories (id, business_id, name, description, sort_order, color, icon) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccc06', '22222222-2222-2222-2222-222222222222', 'Waxing', 'Hair removal services', 6, '#EC4899', 'zap'),
('cccccccc-cccc-cccc-cccc-cccccccccc07', '22222222-2222-2222-2222-222222222222', 'Makeup', 'Professional makeup services', 7, '#8B5CF6', 'palette'),
('cccccccc-cccc-cccc-cccc-cccccccccc08', '22222222-2222-2222-2222-222222222222', 'Massage', 'Relaxation and therapeutic massage', 8, '#06B6D4', 'heart'),
('cccccccc-cccc-cccc-cccc-cccccccccc09', '22222222-2222-2222-2222-222222222222', 'Facial Treatments', 'Skin care and facial services', 9, '#84CC16', 'sparkles'),
('cccccccc-cccc-cccc-cccc-cccccccccc10', '22222222-2222-2222-2222-222222222222', 'Bridal Services', 'Wedding and bridal packages', 10, '#F472B6', 'crown'),
('cccccccc-cccc-cccc-cccc-cccccccccc11', '22222222-2222-2222-2222-222222222222', 'Kids Cuts', 'Haircuts for children', 11, '#FBBF24', 'smile'),
('cccccccc-cccc-cccc-cccc-cccccccccc12', '22222222-2222-2222-2222-222222222222', 'Extensions', 'Hair extensions and add-ons', 12, '#A78BFA', 'link'),
('cccccccc-cccc-cccc-cccc-cccccccccc13', '22222222-2222-2222-2222-222222222222', 'Specialty Treatments', 'Advanced hair treatments', 13, '#34D399', 'flask'),
('cccccccc-cccc-cccc-cccc-cccccccccc14', '22222222-2222-2222-2222-222222222222', 'Express Services', 'Quick touch-up services', 14, '#FB923C', 'clock'),
('cccccccc-cccc-cccc-cccc-cccccccccc15', '22222222-2222-2222-2222-222222222222', 'VIP Packages', 'Premium service packages', 15, '#EF4444', 'star')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 2. Notification Templates (15 templates) - using valid UUIDs
-- ================================================================
INSERT INTO notification_templates (id, business_id, type, channel, subject, body) VALUES
-- Email templates
('a1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222222', 'appointment_confirmation', 'email', 'Appointment Confirmed at Boulevard Salon', 'Hi {{client_name}},

Your appointment has been confirmed!

Service: {{service_name}}
Date: {{date}}
Time: {{time}}
Stylist: {{staff_name}}
Location: {{location}}

See you soon!
Boulevard Salon'),
('a1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222222', 'appointment_reminder', 'email', 'Reminder: Your Appointment Tomorrow', 'Hi {{client_name}},

This is a friendly reminder about your appointment tomorrow.

Service: {{service_name}}
Date: {{date}}
Time: {{time}}
Stylist: {{staff_name}}

Please arrive 10 minutes early.

Boulevard Salon'),
('a1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', 'appointment_cancellation', 'email', 'Appointment Cancelled', 'Hi {{client_name}},

Your appointment on {{date}} at {{time}} has been cancelled.

If you would like to reschedule, please contact us or book online.

Boulevard Salon'),
('a1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222222', 'appointment_rescheduled', 'email', 'Appointment Rescheduled', 'Hi {{client_name}},

Your appointment has been rescheduled.

New Date: {{date}}
New Time: {{time}}
Service: {{service_name}}

Boulevard Salon'),
('a1111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222222', 'no_show', 'email', 'We Missed You Today', 'Hi {{client_name}},

We noticed you missed your appointment today. We hope everything is okay!

Would you like to reschedule? Contact us anytime.

Boulevard Salon'),
('a1111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222222', 'review_request', 'email', 'How Was Your Visit?', 'Hi {{client_name}},

Thank you for visiting Boulevard Salon! We would love to hear about your experience.

Please take a moment to leave us a review.

Boulevard Salon'),
('a1111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222222', 'custom', 'email', 'Special Offer Just for You', 'Hi {{client_name}},

We have a special offer just for you! Book your next appointment and receive 15% off.

Boulevard Salon'),
-- SMS templates
('a1111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222222', 'appointment_confirmation', 'sms', NULL, 'Appointment confirmed at Boulevard Salon on {{date}} at {{time}} with {{staff_name}}. Reply CANCEL to cancel.'),
('a1111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', 'appointment_reminder', 'sms', NULL, 'Reminder: You have an appointment tomorrow at {{time}} at Boulevard Salon. See you soon!'),
('a1111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222222', 'appointment_cancellation', 'sms', NULL, 'Your appointment on {{date}} at Boulevard Salon has been cancelled. Call us to reschedule.'),
('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'appointment_rescheduled', 'sms', NULL, 'Your appointment has been rescheduled to {{date}} at {{time}}. Boulevard Salon'),
('a1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'no_show', 'sms', NULL, 'We missed you today at Boulevard Salon! Call us to reschedule your appointment.'),
('a1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', 'review_request', 'sms', NULL, 'Thanks for visiting Boulevard Salon! How was your experience? Leave us a review!'),
('a1111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', 'custom', 'sms', NULL, 'Boulevard Salon: {{message}}'),
('a1111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222222', 'custom', 'email', 'Thank You for Your Loyalty', 'Hi {{client_name}},

Thank you for being a valued client! As a token of appreciation, enjoy 20% off your next visit.

Boulevard Salon')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 3. Additional Appointments (spread across current and next month)
-- ================================================================
INSERT INTO appointments (id, business_id, location_id, client_id, staff_id, service_id, start_time, end_time, status, price, payment_status, notes) VALUES
-- Today and this week
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa017', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666601', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'scheduled', 85.00, 'pending', 'Regular haircut appointment'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa018', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666602', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours 30 minutes', 'confirmed', 150.00, 'pending', 'Color treatment'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa019', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', '88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666603', NOW() + INTERVAL '1 day 9 hours', NOW() + INTERVAL '1 day 10 hours', 'scheduled', 65.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa020', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666604', NOW() + INTERVAL '1 day 11 hours', NOW() + INTERVAL '1 day 12 hours', 'scheduled', 95.00, 'pending', 'First time client'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa021', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', '88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666605', NOW() + INTERVAL '1 day 14 hours', NOW() + INTERVAL '1 day 15 hours', 'confirmed', 120.00, 'pending', NULL),
-- Next few days
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa022', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666606', NOW() + INTERVAL '2 days 10 hours', NOW() + INTERVAL '2 days 11 hours', 'scheduled', 45.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa023', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', '88888888-8888-8888-8888-888888888807', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666607', NOW() + INTERVAL '2 days 13 hours', NOW() + INTERVAL '2 days 14 hours 30 minutes', 'scheduled', 180.00, 'pending', 'Full highlights'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa024', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888808', '77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666608', NOW() + INTERVAL '3 days 9 hours', NOW() + INTERVAL '3 days 10 hours', 'scheduled', 55.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa025', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', '88888888-8888-8888-8888-888888888809', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666609', NOW() + INTERVAL '3 days 11 hours', NOW() + INTERVAL '3 days 12 hours 30 minutes', 'confirmed', 200.00, 'pending', 'Balayage treatment'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa026', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888810', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666610', NOW() + INTERVAL '4 days 10 hours', NOW() + INTERVAL '4 days 11 hours', 'scheduled', 75.00, 'pending', NULL),
-- Next week
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa027', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', '88888888-8888-8888-8888-888888888811', '77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666611', NOW() + INTERVAL '5 days 9 hours', NOW() + INTERVAL '5 days 10 hours', 'scheduled', 85.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa028', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888812', '77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666612', NOW() + INTERVAL '6 days 11 hours', NOW() + INTERVAL '6 days 12 hours 30 minutes', 'scheduled', 125.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa029', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', '88888888-8888-8888-8888-888888888813', '77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666613', NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 11 hours', 'scheduled', 95.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa030', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888814', '77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666614', NOW() + INTERVAL '8 days 13 hours', NOW() + INTERVAL '8 days 14 hours', 'scheduled', 65.00, 'pending', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa031', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', '88888888-8888-8888-8888-888888888815', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666615', NOW() + INTERVAL '9 days 9 hours', NOW() + INTERVAL '9 days 10 hours 30 minutes', 'scheduled', 140.00, 'pending', 'Deep conditioning'),
-- Past appointments (completed)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa032', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888816', '77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666616', NOW() - INTERVAL '1 day 10 hours', NOW() - INTERVAL '1 day 9 hours', 'completed', 85.00, 'paid', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa033', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', '88888888-8888-8888-8888-888888888817', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666617', NOW() - INTERVAL '2 days 11 hours', NOW() - INTERVAL '2 days 10 hours', 'completed', 150.00, 'paid', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa034', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888818', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666618', NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 8 hours', 'completed', 95.00, 'paid', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa035', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', '88888888-8888-8888-8888-888888888819', '77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666619', NOW() - INTERVAL '4 days 14 hours', NOW() - INTERVAL '4 days 13 hours', 'completed', 200.00, 'paid', NULL),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa036', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888820', '77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666620', NOW() - INTERVAL '5 days 10 hours', NOW() - INTERVAL '5 days 9 hours', 'completed', 120.00, 'paid', NULL)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 4. Additional Payments (need 15 total, have 7)
-- ================================================================
INSERT INTO payments (id, appointment_id, amount, tip, method, status) VALUES
('b1111111-1111-1111-1111-111111111108', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa032', 85.00, 15.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111109', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa033', 150.00, 25.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111110', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa034', 95.00, 10.00, 'cash', 'paid'),
('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa035', 200.00, 40.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa036', 120.00, 20.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111113', '99999999-9999-9999-9999-999999999901', 85.00, 12.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111114', '99999999-9999-9999-9999-999999999902', 150.00, 30.00, 'card', 'paid'),
('b1111111-1111-1111-1111-111111111115', '99999999-9999-9999-9999-999999999903', 65.00, 8.00, 'cash', 'paid')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. Reviews (15 reviews)
-- ================================================================
INSERT INTO reviews (id, business_id, client_id, appointment_id, staff_id, rating, comment, is_public, response, response_at) VALUES
('c1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888801', '99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777771', 5, 'Amazing haircut! Sarah really understood what I wanted. Will definitely be back!', true, 'Thank you so much for your kind words! We look forward to seeing you again!', NOW() - INTERVAL '1 day'),
('c1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888802', '99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777772', 5, 'Mike did an incredible job with my color. The balayage looks so natural!', true, 'So happy you love your new look! Mike is truly talented.', NOW() - INTERVAL '2 days'),
('c1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888803', '99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777773', 4, 'Great service and friendly staff. The only reason for 4 stars is the wait time was a bit long.', true, 'Thank you for your feedback! We are working on improving our scheduling.', NOW() - INTERVAL '3 days'),
('c1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888804', '99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777774', 5, 'Best beard trim I have ever had. Very professional and attention to detail.', true, NULL, NULL),
('c1111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888805', '99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777775', 5, 'Love my new highlights! The staff was so welcoming and the salon is beautiful.', true, 'Thank you! We are so glad you had a great experience!', NOW() - INTERVAL '5 days'),
('c1111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888806', '99999999-9999-9999-9999-999999999906', '77777777-7777-7777-7777-777777777776', 4, 'Good haircut, fair price. Will come back again.', true, NULL, NULL),
('c1111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888807', '99999999-9999-9999-9999-999999999907', '77777777-7777-7777-7777-777777777777', 5, 'The deep conditioning treatment made my hair so soft and shiny!', true, 'We are thrilled you loved the treatment!', NOW() - INTERVAL '7 days'),
('c1111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888808', '99999999-9999-9999-9999-999999999908', '77777777-7777-7777-7777-777777777778', 3, 'Decent service but the stylist seemed rushed. Could have been better.', true, 'We apologize for the experience. Please reach out so we can make it right.', NOW() - INTERVAL '8 days'),
('c1111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888809', '99999999-9999-9999-9999-999999999909', '77777777-7777-7777-7777-777777777771', 5, 'Sarah is the best! She always knows exactly what I want without me having to explain.', true, NULL, NULL),
('c1111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888810', '99999999-9999-9999-9999-999999999910', '77777777-7777-7777-7777-777777777772', 5, 'Excellent experience from start to finish. The online booking was super easy too!', true, 'Thank you! We have worked hard on our booking system.', NOW() - INTERVAL '10 days'),
('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888811', '99999999-9999-9999-9999-999999999911', '77777777-7777-7777-7777-777777777773', 4, 'Really nice salon atmosphere and good service. A bit pricey but worth it.', true, NULL, NULL),
('c1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888812', '99999999-9999-9999-9999-999999999912', '77777777-7777-7777-7777-777777777774', 5, 'Got my hair done for my wedding and it was perfect! Thank you so much!', true, 'Congratulations! We were honored to be part of your special day!', NOW() - INTERVAL '12 days'),
('c1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888813', '99999999-9999-9999-9999-999999999913', '77777777-7777-7777-7777-777777777775', 4, 'Good service overall. The parking situation could be better though.', true, 'Thanks for the feedback! We are looking into parking solutions.', NOW() - INTERVAL '13 days'),
('c1111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888814', '99999999-9999-9999-9999-999999999914', '77777777-7777-7777-7777-777777777776', 5, 'My kids love coming here! The stylists are so patient with them.', true, NULL, NULL),
('c1111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888815', '99999999-9999-9999-9999-999999999915', '77777777-7777-7777-7777-777777777777', 5, 'Absolutely love my new look! Already booked my next appointment.', true, 'We cannot wait to see you again!', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 6. Recurring Series (15 recurring appointments)
-- ================================================================
INSERT INTO recurring_series (id, business_id, client_id, staff_id, service_id, pattern, day_of_week, preferred_time, duration_minutes, price, start_date, max_occurrences, notes) VALUES
('d1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666601', 'weekly', 1, '10:00:00', 60, 85.00, CURRENT_DATE, 12, 'Regular weekly haircut'),
('d1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666602', 'monthly', 15, '14:00:00', 90, 150.00, CURRENT_DATE, 6, 'Monthly color touch-up'),
('d1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666603', 'biweekly', 3, '11:00:00', 45, 65.00, CURRENT_DATE, 10, 'Bi-weekly blowout'),
('d1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666604', 'weekly', 5, '09:00:00', 30, 35.00, CURRENT_DATE, 52, 'Weekly beard trim'),
('d1111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666605', 'monthly', 1, '15:00:00', 120, 200.00, CURRENT_DATE, 12, 'Monthly highlights'),
('d1111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666606', 'biweekly', 2, '13:00:00', 60, 85.00, CURRENT_DATE, 8, 'Bi-weekly haircut'),
('d1111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888807', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666607', 'monthly', 20, '10:30:00', 90, 140.00, CURRENT_DATE, 6, 'Monthly deep conditioning'),
('d1111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888808', '77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666608', 'weekly', 4, '16:00:00', 45, 55.00, CURRENT_DATE, 20, 'Weekly styling'),
('d1111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888809', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666609', 'biweekly', 6, '11:30:00', 150, 250.00, CURRENT_DATE, 6, 'Bi-weekly balayage touch-up'),
('d1111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888810', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666610', 'weekly', 0, '12:00:00', 60, 75.00, CURRENT_DATE, 16, 'Weekly haircut - Sunday'),
('d1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888811', '77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666611', 'monthly', 10, '14:30:00', 60, 85.00, CURRENT_DATE, 12, 'Monthly trim'),
('d1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888812', '77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666612', 'biweekly', 1, '09:30:00', 75, 95.00, CURRENT_DATE, 10, 'Bi-weekly cut and style'),
('d1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888813', '77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666613', 'monthly', 5, '15:30:00', 180, 300.00, CURRENT_DATE, 6, 'Monthly full treatment'),
('d1111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888814', '77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666614', 'weekly', 3, '10:00:00', 45, 50.00, CURRENT_DATE, 24, 'Weekly kids haircut'),
('d1111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888815', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666615', 'biweekly', 5, '13:30:00', 60, 80.00, CURRENT_DATE, 12, 'Bi-weekly blowout and style')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 7. Notification Log (15+ notification records)
-- ================================================================
INSERT INTO notification_log (id, business_id, client_id, appointment_id, type, channel, recipient, subject, body, status, sent_at, delivered_at) VALUES
('e1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888801', '99999999-9999-9999-9999-999999999901', 'appointment_confirmation', 'email', 'emma.wilson@email.com', 'Appointment Confirmed', 'Your appointment has been confirmed for tomorrow at 10:00 AM.', 'delivered', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('e1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888801', '99999999-9999-9999-9999-999999999901', 'appointment_reminder', 'sms', '+15551234001', NULL, 'Reminder: You have an appointment tomorrow at 10:00 AM at Boulevard Salon.', 'delivered', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('e1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888802', '99999999-9999-9999-9999-999999999902', 'appointment_confirmation', 'email', 'james.chen@email.com', 'Appointment Confirmed', 'Your color treatment appointment is confirmed.', 'delivered', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('e1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888803', '99999999-9999-9999-9999-999999999903', 'appointment_confirmation', 'email', 'sophia.martinez@email.com', 'Appointment Confirmed', 'Your appointment has been confirmed.', 'delivered', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('e1111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888804', '99999999-9999-9999-9999-999999999904', 'appointment_reminder', 'sms', '+15551234004', NULL, 'Reminder: Beard trim tomorrow at 11:00 AM.', 'delivered', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('e1111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888805', '99999999-9999-9999-9999-999999999905', 'review_request', 'email', 'olivia.johnson@email.com', 'How Was Your Visit?', 'Thank you for visiting! We would love to hear your feedback.', 'delivered', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('e1111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888806', '99999999-9999-9999-9999-999999999906', 'appointment_confirmation', 'email', 'noah.brown@email.com', 'Appointment Confirmed', 'Your haircut is scheduled for next week.', 'delivered', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('e1111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888807', '99999999-9999-9999-9999-999999999907', 'appointment_reminder', 'email', 'ava.davis@email.com', 'Appointment Tomorrow', 'Just a friendly reminder about your appointment tomorrow.', 'sent', NOW() - INTERVAL '12 hours', NULL),
('e1111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888808', '99999999-9999-9999-9999-999999999908', 'no_show', 'email', 'liam.miller@email.com', 'We Missed You', 'We noticed you missed your appointment. Would you like to reschedule?', 'delivered', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('e1111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888809', '99999999-9999-9999-9999-999999999909', 'appointment_rescheduled', 'sms', '+15551234009', NULL, 'Your appointment has been rescheduled to Friday at 2:00 PM.', 'delivered', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888810', '99999999-9999-9999-9999-999999999910', 'appointment_confirmation', 'email', 'mia.garcia@email.com', 'Booking Confirmed', 'Your appointment is confirmed. See you soon!', 'delivered', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('e1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888811', '99999999-9999-9999-9999-999999999911', 'review_request', 'sms', '+15551234011', NULL, 'Thanks for visiting! Rate your experience.', 'delivered', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('e1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888812', '99999999-9999-9999-9999-999999999912', 'appointment_cancellation', 'email', 'ethan.rodriguez@email.com', 'Appointment Cancelled', 'Your appointment has been cancelled per your request.', 'delivered', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
('e1111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888813', '99999999-9999-9999-9999-999999999913', 'appointment_reminder', 'email', 'charlotte.lee@email.com', 'Appointment Reminder', 'Your appointment is coming up in 24 hours.', 'pending', NULL, NULL),
('e1111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888814', '99999999-9999-9999-9999-999999999914', 'appointment_confirmation', 'sms', '+15551234014', NULL, 'Confirmed! See you on Saturday at 3 PM.', 'delivered', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('e1111111-1111-1111-1111-111111111116', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888815', '99999999-9999-9999-9999-999999999915', 'review_request', 'email', 'benjamin.walker@email.com', 'Share Your Experience', 'How was your visit? Leave us a review!', 'sent', NOW() - INTERVAL '1 day', NULL)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 8. Daily Metrics (15+ days of metrics)
-- ================================================================
INSERT INTO daily_metrics (id, business_id, date, total_revenue, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments, new_clients, returning_clients, average_service_value, total_tips, staff_count, utilization_rate) VALUES
('f1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '14 days', 1250.00, 12, 10, 1, 1, 2, 8, 125.00, 185.00, 6, 72.5),
('f1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '13 days', 980.00, 10, 9, 0, 1, 1, 8, 108.89, 142.00, 5, 68.0),
('f1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '12 days', 1480.00, 14, 13, 1, 0, 3, 10, 113.85, 210.00, 7, 78.5),
('f1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '11 days', 890.00, 9, 8, 1, 0, 1, 7, 111.25, 125.00, 5, 65.0),
('f1111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '10 days', 1650.00, 15, 14, 0, 1, 4, 10, 117.86, 245.00, 8, 82.0),
('f1111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '9 days', 1100.00, 11, 10, 1, 0, 2, 8, 110.00, 165.00, 6, 70.0),
('f1111111-1111-1111-1111-111111111107', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '8 days', 1320.00, 13, 12, 0, 1, 2, 10, 110.00, 195.00, 7, 75.5),
('f1111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '7 days', 1580.00, 16, 15, 1, 0, 3, 12, 105.33, 230.00, 8, 80.0),
('f1111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '6 days', 920.00, 8, 8, 0, 0, 1, 7, 115.00, 135.00, 5, 62.0),
('f1111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', 1420.00, 14, 13, 0, 1, 2, 11, 109.23, 205.00, 7, 76.0),
('f1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '4 days', 1780.00, 18, 17, 1, 0, 4, 13, 104.71, 265.00, 8, 85.0),
('f1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days', 1050.00, 10, 9, 1, 0, 1, 8, 116.67, 155.00, 6, 68.5),
('f1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', 1350.00, 13, 12, 0, 1, 2, 10, 112.50, 200.00, 7, 74.0),
('f1111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', 1620.00, 16, 15, 1, 0, 3, 12, 108.00, 240.00, 8, 79.5),
('f1111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222222', CURRENT_DATE, 450.00, 5, 4, 0, 1, 1, 3, 112.50, 65.00, 4, 45.0)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 9. Staff Daily Metrics (15+ records) - using correct column names
-- ================================================================
INSERT INTO staff_daily_metrics (id, staff_id, date, total_revenue, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments, hours_worked, utilization_rate, total_tips, average_rating) VALUES
('01111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777771', CURRENT_DATE - INTERVAL '1 day', 425.00, 6, 5, 1, 0, 8.0, 85.0, 65.00, 4.8),
('01111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777772', CURRENT_DATE - INTERVAL '1 day', 520.00, 5, 4, 0, 1, 8.0, 75.0, 80.00, 4.9),
('01111111-1111-1111-1111-111111111103', '77777777-7777-7777-7777-777777777773', CURRENT_DATE - INTERVAL '1 day', 285.00, 4, 3, 1, 0, 6.0, 70.0, 40.00, 4.5),
('01111111-1111-1111-1111-111111111104', '77777777-7777-7777-7777-777777777774', CURRENT_DATE - INTERVAL '1 day', 195.00, 4, 3, 0, 1, 6.0, 65.0, 30.00, 4.7),
('01111111-1111-1111-1111-111111111105', '77777777-7777-7777-7777-777777777771', CURRENT_DATE - INTERVAL '2 days', 510.00, 7, 6, 1, 0, 8.0, 90.0, 75.00, 4.9),
('01111111-1111-1111-1111-111111111106', '77777777-7777-7777-7777-777777777772', CURRENT_DATE - INTERVAL '2 days', 650.00, 6, 5, 0, 1, 8.0, 82.0, 95.00, 5.0),
('01111111-1111-1111-1111-111111111107', '77777777-7777-7777-7777-777777777773', CURRENT_DATE - INTERVAL '2 days', 340.00, 5, 4, 1, 0, 7.0, 75.0, 50.00, 4.6),
('01111111-1111-1111-1111-111111111108', '77777777-7777-7777-7777-777777777775', CURRENT_DATE - INTERVAL '2 days', 450.00, 4, 3, 0, 1, 6.0, 68.0, 70.00, 4.8),
('01111111-1111-1111-1111-111111111109', '77777777-7777-7777-7777-777777777771', CURRENT_DATE - INTERVAL '3 days', 340.00, 5, 4, 1, 0, 7.0, 78.0, 50.00, 4.7),
('01111111-1111-1111-1111-111111111110', '77777777-7777-7777-7777-777777777772', CURRENT_DATE - INTERVAL '3 days', 390.00, 4, 3, 0, 1, 6.0, 70.0, 55.00, 4.8),
('01111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777776', CURRENT_DATE - INTERVAL '3 days', 280.00, 5, 4, 1, 0, 7.0, 72.0, 40.00, 4.5),
('01111111-1111-1111-1111-111111111112', '77777777-7777-7777-7777-777777777777', CURRENT_DATE - INTERVAL '3 days', 560.00, 6, 5, 0, 1, 8.0, 80.0, 85.00, 4.9),
('01111111-1111-1111-1111-111111111113', '77777777-7777-7777-7777-777777777778', CURRENT_DATE - INTERVAL '3 days', 220.00, 4, 3, 1, 0, 6.0, 65.0, 30.00, 4.4),
('01111111-1111-1111-1111-111111111114', '77777777-7777-7777-7777-777777777771', CURRENT_DATE, 170.00, 3, 2, 0, 1, 4.0, 60.0, 25.00, 5.0),
('01111111-1111-1111-1111-111111111115', '77777777-7777-7777-7777-777777777772', CURRENT_DATE, 280.00, 3, 2, 1, 0, 4.0, 65.0, 40.00, 4.8)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 10. Service Metrics (15+ records) - using correct column names
-- ================================================================
INSERT INTO service_metrics (id, service_id, date, bookings_count, total_revenue, average_price, cancellation_rate) VALUES
('02111111-1111-1111-1111-111111111101', '66666666-6666-6666-6666-666666666601', CURRENT_DATE - INTERVAL '7 days', 12, 1020.00, 85.00, 8.3),
('02111111-1111-1111-1111-111111111102', '66666666-6666-6666-6666-666666666602', CURRENT_DATE - INTERVAL '7 days', 8, 1200.00, 150.00, 12.5),
('02111111-1111-1111-1111-111111111103', '66666666-6666-6666-6666-666666666603', CURRENT_DATE - INTERVAL '7 days', 15, 975.00, 65.00, 6.7),
('02111111-1111-1111-1111-111111111104', '66666666-6666-6666-6666-666666666604', CURRENT_DATE - INTERVAL '7 days', 20, 700.00, 35.00, 5.0),
('02111111-1111-1111-1111-111111111105', '66666666-6666-6666-6666-666666666605', CURRENT_DATE - INTERVAL '7 days', 5, 1000.00, 200.00, 20.0),
('02111111-1111-1111-1111-111111111106', '66666666-6666-6666-6666-666666666601', CURRENT_DATE, 3, 255.00, 85.00, 0.0),
('02111111-1111-1111-1111-111111111107', '66666666-6666-6666-6666-666666666602', CURRENT_DATE, 2, 300.00, 150.00, 0.0),
('02111111-1111-1111-1111-111111111108', '66666666-6666-6666-6666-666666666606', CURRENT_DATE - INTERVAL '7 days', 10, 450.00, 45.00, 10.0),
('02111111-1111-1111-1111-111111111109', '66666666-6666-6666-6666-666666666607', CURRENT_DATE - INTERVAL '7 days', 6, 840.00, 140.00, 16.7),
('02111111-1111-1111-1111-111111111110', '66666666-6666-6666-6666-666666666608', CURRENT_DATE - INTERVAL '7 days', 8, 440.00, 55.00, 12.5),
('02111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666609', CURRENT_DATE - INTERVAL '7 days', 4, 1000.00, 250.00, 25.0),
('02111111-1111-1111-1111-111111111112', '66666666-6666-6666-6666-666666666610', CURRENT_DATE - INTERVAL '7 days', 9, 675.00, 75.00, 11.1),
('02111111-1111-1111-1111-111111111113', '66666666-6666-6666-6666-666666666611', CURRENT_DATE - INTERVAL '7 days', 7, 595.00, 85.00, 14.3),
('02111111-1111-1111-1111-111111111114', '66666666-6666-6666-6666-666666666612', CURRENT_DATE - INTERVAL '7 days', 6, 750.00, 125.00, 16.7),
('02111111-1111-1111-1111-111111111115', '66666666-6666-6666-6666-666666666613', CURRENT_DATE - INTERVAL '7 days', 3, 285.00, 95.00, 33.3)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 11. Staff Availability (ensure all staff have availability)
-- ================================================================
DELETE FROM staff_availability;

-- Staff 1 - Sarah Johnson (all week)
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777771', 0, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777771', 1, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777771', 2, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777771', 3, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777771', 4, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777771', 5, '09:00:00', '19:00:00', true),
('77777777-7777-7777-7777-777777777771', 6, '10:00:00', '16:00:00', true);

-- Staff 2 - Mike Williams
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777772', 0, '11:00:00', '19:00:00', true),
('77777777-7777-7777-7777-777777777772', 1, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777772', 2, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777772', 3, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777772', 4, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777772', 5, '09:00:00', '20:00:00', true),
('77777777-7777-7777-7777-777777777772', 6, '09:00:00', '17:00:00', true);

-- Staff 3 - Emily Davis
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777773', 1, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777773', 2, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777773', 3, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777773', 4, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777773', 5, '09:00:00', '17:00:00', true);

-- Staff 4 - Chris Brown
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777774', 0, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777774', 1, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777774', 2, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777774', 3, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777774', 4, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777774', 5, '09:00:00', '19:00:00', true);

-- Staff 5 - Jessica Taylor
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777775', 1, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777775', 2, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777775', 3, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777775', 4, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777775', 5, '10:00:00', '20:00:00', true),
('77777777-7777-7777-7777-777777777775', 6, '10:00:00', '16:00:00', true);

-- Staff 6 - David Martinez
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777776', 0, '11:00:00', '19:00:00', true),
('77777777-7777-7777-7777-777777777776', 2, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777776', 3, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777776', 4, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777776', 5, '09:00:00', '19:00:00', true),
('77777777-7777-7777-7777-777777777776', 6, '10:00:00', '18:00:00', true);

-- Staff 7 - Amanda Wilson
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777777', 0, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777777', 1, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777777', 2, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777777', 3, '09:00:00', '17:00:00', true),
('77777777-7777-7777-7777-777777777777', 5, '09:00:00', '19:00:00', true),
('77777777-7777-7777-7777-777777777777', 6, '10:00:00', '16:00:00', true);

-- Staff 8 - Robert Anderson
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available) VALUES
('77777777-7777-7777-7777-777777777778', 1, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777778', 2, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777778', 3, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777778', 4, '10:00:00', '18:00:00', true),
('77777777-7777-7777-7777-777777777778', 5, '10:00:00', '20:00:00', true);

-- ================================================================
-- Summary counts verification
-- ================================================================
SELECT 'Seeding complete!' as status;
SELECT 'service_categories' as tbl, COUNT(*) as cnt FROM service_categories
UNION ALL SELECT 'notification_templates', COUNT(*) FROM notification_templates
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'recurring_series', COUNT(*) FROM recurring_series
UNION ALL SELECT 'notification_log', COUNT(*) FROM notification_log
UNION ALL SELECT 'daily_metrics', COUNT(*) FROM daily_metrics
UNION ALL SELECT 'staff_daily_metrics', COUNT(*) FROM staff_daily_metrics
UNION ALL SELECT 'service_metrics', COUNT(*) FROM service_metrics
UNION ALL SELECT 'staff_availability', COUNT(*) FROM staff_availability
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'clients', COUNT(*) FROM clients
ORDER BY tbl;
