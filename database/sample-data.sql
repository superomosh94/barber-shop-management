USE barber_shop_db;

-- Insert sample admin users
INSERT INTO admin_users (username, password, email, role, first_name, last_name, permissions) VALUES
('superadmin', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'superadmin@classiccuts.com', 'super_admin', 'John', 'Smith', '{"appointments": ["read", "write", "delete"], "services": ["read", "write", "delete"], "barbers": ["read", "write", "delete"], "customers": ["read", "write", "delete"], "ratings": ["read", "write", "delete"], "reports": ["read", "write"], "settings": ["read", "write"]}'),
('admin', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'admin@classiccuts.com', 'admin', 'Sarah', 'Johnson', '{"appointments": ["read", "write"], "services": ["read", "write"], "barbers": ["read", "write"], "customers": ["read", "write"], "ratings": ["read", "write"], "reports": ["read"], "settings": ["read"]}'),
('manager', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'manager@classiccuts.com', 'manager', 'Mike', 'Davis', '{"appointments": ["read", "write"], "services": ["read"], "barbers": ["read"], "customers": ["read"], "ratings": ["read"], "reports": ["read"], "settings": ["read"]}');

-- Insert sample services
INSERT INTO services (name, description, price, duration, category, is_active) VALUES
('Classic Haircut', 'Professional haircut with clipper and scissor work, includes shampoo and style', 25.00, 30, 'haircut', TRUE),
('Beard Trim', 'Precise beard shaping and trimming with hot towel treatment', 15.00, 20, 'shave', TRUE),
('Haircut & Beard', 'Complete grooming package with haircut and beard trim', 35.00, 45, 'haircut', TRUE),
('Royal Shave', 'Traditional straight razor shave with hot towels and premium products', 30.00, 30, 'shave', TRUE),
('Hair Coloring', 'Professional hair coloring service with consultation', 60.00, 90, 'coloring', TRUE),
('Scalp Treatment', 'Therapeutic scalp treatment for dandruff and dry scalp', 25.00, 30, 'treatment', TRUE),
('Kids Haircut', 'Special haircut service for children under 12', 18.00, 25, 'haircut', TRUE),
('Hair Styling', 'Special occasion styling and blowout', 35.00, 40, 'styling', TRUE),
('Hair Wash & Style', 'Relaxing shampoo with professional styling', 20.00, 25, 'styling', TRUE),
('Face Massage', 'Relaxing face and scalp massage', 25.00, 25, 'treatment', TRUE);

-- Insert sample barbers
INSERT INTO barbers (name, specialty, bio, email, phone, experience, is_active, working_hours) VALUES
('Tony Reynolds', 'Classic Cuts', 'With over 15 years of experience, Tony specializes in traditional barbering techniques and modern styles. His attention to detail and customer service makes him a favorite among our clients.', 'tony@classiccuts.com', '(555) 010-1234', 15, TRUE, '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "19:00"}, "saturday": {"start": "10:00", "end": "17:00"}, "sunday": {"start": "10:00", "end": "16:00"}}'),
('Marcus Chen', 'Beard Grooming', 'Marcus is our beard specialist with expertise in precision trimming and shaping. He stays updated with the latest trends in facial hair styling.', 'marcus@classiccuts.com', '(555) 010-5678', 8, TRUE, '{"monday": {"start": "10:00", "end": "19:00"}, "tuesday": {"start": "10:00", "end": "19:00"}, "wednesday": {"start": "10:00", "end": "19:00"}, "thursday": {"start": "10:00", "end": "19:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "09:00", "end": "16:00"}, "sunday": null}'),
('James Rodriguez', 'Modern Styles', 'James brings fresh, contemporary styles to Classic Cuts. He excels in fade cuts, undercuts, and modern hairstyles for the fashion-forward client.', 'james@classiccuts.com', '(555) 010-9012', 6, TRUE, '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "10:00", "end": "17:00"}, "sunday": null}'),
('David Wilson', 'Traditional Barbering', 'David is our senior barber with 20+ years of experience. He specializes in traditional wet shaves and classic gentleman''s grooming.', 'david@classiccuts.com', '(555) 010-3456', 22, TRUE, '{"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "17:00"}, "saturday": null, "sunday": null}');

-- Insert sample customers
INSERT INTO customers (name, email, password, phone, is_active) VALUES
('Michael Brown', 'michael.brown@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 123-4567', TRUE),
('Jennifer Wilson', 'jennifer.wilson@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 234-5678', TRUE),
('Robert Taylor', 'robert.taylor@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 345-6789', TRUE),
('Maria Garcia', 'maria.garcia@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 456-7890', TRUE),
('William Johnson', 'william.johnson@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 567-8901', TRUE),
('Lisa Anderson', 'lisa.anderson@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 678-9012', TRUE),
('Christopher Lee', 'chris.lee@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 789-0123', TRUE),
('Amanda White', 'amanda.white@email.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', '(555) 890-1234', TRUE);

-- Insert sample appointments (past appointments)
INSERT INTO appointments (customer_id, service_id, barber_id, appointment_date, appointment_end, status, total_price) VALUES
(1, 1, 1, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY + INTERVAL 45 MINUTE), 'completed', 25.00),
(2, 3, 2, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY + INTERVAL 45 MINUTE), 'completed', 35.00),
(3, 2, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY + INTERVAL 30 MINUTE), 'completed', 15.00),
(4, 1, 4, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY + INTERVAL 45 MINUTE), 'completed', 25.00),
(5, 4, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY + INTERVAL 30 MINUTE), 'completed', 30.00),
(6, 5, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY + INTERVAL 90 MINUTE), 'completed', 60.00),
(7, 1, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY + INTERVAL 45 MINUTE), 'completed', 25.00);

-- Insert upcoming appointments
INSERT INTO appointments (customer_id, service_id, barber_id, appointment_date, appointment_end, status, total_price) VALUES
(1, 3, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY + INTERVAL 45 MINUTE), 'confirmed', 35.00),
(2, 1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY + INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 30 MINUTE), 'pending', 25.00),
(3, 2, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY + INTERVAL 20 MINUTE), 'confirmed', 15.00),
(4, 6, 4, DATE_ADD(NOW(), INTERVAL 2 DAY + INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 2 DAY + INTERVAL 3 HOUR + INTERVAL 30 MINUTE), 'pending', 25.00),
(5, 1, 1, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY + INTERVAL 30 MINUTE), 'confirmed', 25.00);

-- Insert sample ratings
INSERT INTO ratings (appointment_id, barber_id, customer_id, rating, review, is_approved) VALUES
(1, 1, 1, 5, 'Tony did an amazing job with my haircut! Very professional and attention to detail is superb.', TRUE),
(2, 2, 2, 4, 'Marcus is great with beards. My beard has never looked better. Will definitely come back!', TRUE),
(3, 3, 3, 5, 'James is a true artist! He understood exactly what I wanted and delivered beyond expectations.', TRUE),
(4, 4, 4, 4, 'David gave me the best traditional shave I''ve ever had. Very relaxing experience.', TRUE),
(5, 1, 5, 5, 'Tony is the best barber in town. Consistent quality every time I visit.', TRUE),
(6, 2, 6, 4, 'Good coloring service. Marcus took time to understand exactly what I wanted.', TRUE),
(7, 3, 7, 5, 'James is fantastic! Great conversation and even better haircut. Highly recommended!', TRUE);