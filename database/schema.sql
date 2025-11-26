-- Create database
CREATE DATABASE IF NOT EXISTS barber_shop_db;
USE barber_shop_db;

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