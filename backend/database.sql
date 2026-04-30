-- Task Owner: Team FULLSTOK - Initial Setup & General Config
-- HR Dashboard Database Schema (Final ERD)

-- Create database
CREATE DATABASE IF NOT EXISTS hr_dashboard;
USE hr_dashboard;

-- Users table (Enhanced for Employee Directory)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    position VARCHAR(100) NULL,              -- Jabatan
    department VARCHAR(100) NULL,            -- Departemen
    phone VARCHAR(20) NULL,                  -- Nomor telepon
    address TEXT NULL,                       -- Alamat
    hire_date DATE NULL,                     -- Tanggal bergabung
    salary DECIMAL(10,2) NULL,               -- Gaji (opsional)
    is_active BOOLEAN DEFAULT TRUE,          -- Status aktif karyawan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance table (Enhanced)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME NULL,                      -- Jam masuk
    check_out TIME NULL,                     -- Jam keluar
    status ENUM('present', 'absent', 'late', 'permission') DEFAULT 'present',
    notes TEXT NULL,                         -- Keterangan
    approved_by INT NULL,                    -- Disetujui oleh (jika ada)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_date (user_id, date)
);

-- Leave requests table (Enhanced)
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                    -- Pemohon cuti
    leave_type ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,                 -- Total hari cuti (auto-calculate)
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,                    -- Yang menyetujui
    approved_at TIMESTAMP NULL,              -- Waktu approval
    rejection_reason TEXT NULL,             -- Alasan penolakan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (end_date >= start_date)
);

-- Announcements table (Enhanced)
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,                 -- Pembuat pengumuman
    category ENUM('general', 'policy', 'event', 'urgent') DEFAULT 'general',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,          -- Status aktif
    expiry_date DATE NULL,                   -- Tanggal kadaluarsa (opsional)
    view_count INT DEFAULT 0,               -- Counter views
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- User sessions table (Optional - for tracking login)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,       -- Hash dari JWT token
    ip_address VARCHAR(45) NULL,            -- IP address
    user_agent TEXT NULL,                   -- Browser info
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- Insert default admin account
INSERT INTO users (name, email, password, role, position, department, is_active) VALUES 
('Admin Fullstok', 'adminfullstok@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', 'IT', TRUE)
ON DUPLICATE KEY UPDATE email = email;

-- Insert dummy data for testing (optional)
INSERT IGNORE INTO users (name, email, password, role, position, department, hire_date, is_active) VALUES
('John Doe', 'admin.john@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Software Engineer', 'IT', '2023-01-15', TRUE),
('Jane Smith', 'admin.jane@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'HR Manager', 'Human Resources', '2022-06-01', TRUE),
('Mike Johnson', 'admin.mike@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Sales Executive', 'Sales', '2023-03-10', TRUE);

INSERT IGNORE INTO announcements (title, content, created_by, category, priority, is_active) VALUES
('Welcome to HR Dashboard', 'This is the new HR Management System for our company. Please explore all features.', 1, 'general', 'high', TRUE),
('New Policy Update', 'Working from home policy has been updated. Please check the new guidelines.', 1, 'policy', 'medium', TRUE);

INSERT IGNORE INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status) VALUES
(2, 'vacation', '2024-05-01', '2024-05-03', 3, 'Family vacation', 'pending'),
(3, 'sick', '2024-04-28', '2024-04-28', 1, 'Medical checkup', 'approved');
