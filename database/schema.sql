-- Create database
CREATE DATABASE IF NOT EXISTS barber_shop_db;
USE barber_shop_db;

-- Drop tables in correct order to handle foreign key constraints
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS barbers;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS customers;

-- Table: customers
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INT NOT NULL DEFAULT 30 COMMENT 'Duration in minutes',
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    category ENUM('haircut', 'shave', 'styling', 'coloring', 'treatment', 'other') DEFAULT 'haircut',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_price (price)
);

-- Table: barbers
CREATE TABLE IF NOT EXISTS barbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    bio TEXT,
    image VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20),
    experience INT COMMENT 'Years of experience',
    is_active BOOLEAN DEFAULT TRUE,
    working_hours JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_specialty (specialty)
);

-- Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    barber_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    appointment_end DATETIME,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_barber_id (barber_id),
    INDEX idx_service_id (service_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_customer_status (customer_id, status)
);

-- Table: ratings
CREATE TABLE IF NOT EXISTS ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT UNIQUE NOT NULL,
    barber_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    INDEX idx_barber_id (barber_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_rating (rating),
    INDEX idx_is_approved (is_approved),
    INDEX idx_created_at (created_at)
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Insert sample admin users
INSERT INTO admin_users (username, password, email, role, first_name, last_name, permissions, is_active) VALUES
('superadmin', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'superadmin@classiccuts.com', 'super_admin', 'John', 'Smith', '{"appointments": ["read", "write", "delete"], "services": ["read", "write", "delete"], "barbers": ["read", "write", "delete"], "customers": ["read", "write", "delete"], "ratings": ["read", "write", "delete"], "reports": ["read", "write"], "settings": ["read", "write"]}', TRUE),
('admin', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'admin@classiccuts.com', 'admin', 'Sarah', 'Johnson', '{"appointments": ["read", "write"], "services": ["read", "write"], "barbers": ["read", "write"], "customers": ["read", "write"], "ratings": ["read", "write"], "reports": ["read"], "settings": ["read"]}', TRUE),
('manager', '$2a$12$LQv3c1yqBWVHxkd0L9kZrOaRWF4I9zqY9NcZ5JcY9JcY9JcY9JcY', 'manager@classiccuts.com', 'manager', 'Mike', 'Davis', '{"appointments": ["read", "write"], "services": ["read"], "barbers": ["read"], "customers": ["read"], "ratings": ["read"], "reports": ["read"], "settings": ["read"]}', TRUE);

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
-- Fixed date calculations using proper MySQL syntax
INSERT INTO appointments (customer_id, service_id, barber_id, appointment_date, appointment_end, status, total_price) VALUES
(1, 1, 1, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY + INTERVAL 30 MINUTE, 'completed', 25.00),
(2, 3, 2, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY + INTERVAL 45 MINUTE, 'completed', 35.00),
(3, 2, 3, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY + INTERVAL 20 MINUTE, 'completed', 15.00),
(4, 1, 4, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY + INTERVAL 30 MINUTE, 'completed', 25.00),
(5, 4, 1, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 30 MINUTE, 'completed', 30.00),
(6, 5, 2, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 90 MINUTE, 'completed', 60.00),
(7, 1, 3, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 30 MINUTE, 'completed', 25.00);

-- Insert upcoming appointments
INSERT INTO appointments (customer_id, service_id, barber_id, appointment_date, appointment_end, status, total_price) VALUES
(1, 3, 1, NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 45 MINUTE, 'confirmed', 35.00),
(2, 1, 2, NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR, NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 30 MINUTE, 'pending', 25.00),
(3, 2, 3, NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 20 MINUTE, 'confirmed', 15.00),
(4, 6, 4, NOW() + INTERVAL 2 DAY + INTERVAL 3 HOUR, NOW() + INTERVAL 2 DAY + INTERVAL 3 HOUR + INTERVAL 30 MINUTE, 'pending', 25.00),
(5, 1, 1, NOW() + INTERVAL 3 DAY, NOW() + INTERVAL 3 DAY + INTERVAL 30 MINUTE, 'confirmed', 25.00);

-- Insert sample ratings
INSERT INTO ratings (appointment_id, barber_id, customer_id, rating, review, is_approved) VALUES
(1, 1, 1, 5, 'Tony did an amazing job with my haircut! Very professional and attention to detail is superb.', TRUE),
(2, 2, 2, 4, 'Marcus is great with beards. My beard has never looked better. Will definitely come back!', TRUE),
(3, 3, 3, 5, 'James is a true artist! He understood exactly what I wanted and delivered beyond expectations.', TRUE),
(4, 4, 4, 4, 'David gave me the best traditional shave I''ve ever had. Very relaxing experience.', TRUE),
(5, 1, 5, 5, 'Tony is the best barber in town. Consistent quality every time I visit.', TRUE),
(6, 2, 6, 4, 'Good coloring service. Marcus took time to understand exactly what I wanted.', TRUE),
(7, 3, 7, 5, 'James is fantastic! Great conversation and even better haircut. Highly recommended!', TRUE);

-- Create views for reporting

-- View: barber_performance
CREATE OR REPLACE VIEW barber_performance AS
SELECT 
    b.id,
    b.name,
    b.specialty,
    COUNT(a.id) as total_appointments,
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
    SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_appointments,
    AVG(r.rating) as average_rating,
    COUNT(r.id) as total_ratings,
    SUM(a.total_price) as total_revenue
FROM barbers b
LEFT JOIN appointments a ON b.id = a.barber_id
LEFT JOIN ratings r ON a.id = r.appointment_id
GROUP BY b.id, b.name, b.specialty;

-- View: service_popularity
CREATE OR REPLACE VIEW service_popularity AS
SELECT 
    s.id,
    s.name,
    s.category,
    s.price,
    COUNT(a.id) as total_bookings,
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(a.total_price) as total_revenue
FROM services s
LEFT JOIN appointments a ON s.id = a.service_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.category, s.price;

-- View: customer_activity
CREATE OR REPLACE VIEW customer_activity AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    COUNT(a.id) as total_appointments,
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
    SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_appointments,
    MAX(a.appointment_date) as last_visit,
    SUM(a.total_price) as total_spent
FROM customers c
LEFT JOIN appointments a ON c.id = a.customer_id
GROUP BY c.id, c.name, c.email, c.phone;

-- View: daily_appointments
CREATE OR REPLACE VIEW daily_appointments AS
SELECT 
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    SUM(total_price) as daily_revenue
FROM appointments
GROUP BY DATE(appointment_date)
ORDER BY appointment_day DESC;

-- Display success message
SELECT '✅ Database setup completed successfully!' as status;
SELECT '📊 Tables created: customers, services, barbers, appointments, ratings, admin_users' as tables_created;
SELECT '👥 Sample data inserted: 3 admin users, 10 services, 4 barbers, 8 customers, 12 appointments, 7 ratings' as data_inserted;
SELECT '📈 Reporting views created: barber_performance, service_popularity, customer_activity, daily_appointments' as views_created;