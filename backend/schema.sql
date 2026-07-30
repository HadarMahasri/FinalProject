-- MySQL Database Schema for EventHub Platform
CREATE DATABASE IF NOT EXISTS `eventhub_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `eventhub_db`;

-- Drop tables in order of dependency if re-running
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `media`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `vendors`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'vendor', 'admin') NOT NULL DEFAULT 'customer',
  `phone` VARCHAR(20) DEFAULT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vendors Table
CREATE TABLE `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `business_name` VARCHAR(150) NOT NULL,
  `category` ENUM('photography', 'dj_music', 'catering', 'venue', 'design_flowers', 'other') NOT NULL,
  `description` TEXT,
  `location` VARCHAR(100) NOT NULL,
  `starting_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `is_approved` BOOLEAN DEFAULT FALSE,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `rating_avg` DECIMAL(3,2) DEFAULT 5.00,
  `review_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Media Table
CREATE TABLE `media` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` INT NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(50) DEFAULT 'image',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Events Table
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `event_type` VARCHAR(50) NOT NULL, -- e.g., Wedding, Bar Mitzvah, Birthday, Corporate
  `event_date` DATE NOT NULL,
  `budget` DECIMAL(10, 2) DEFAULT 0.00,
  `location` VARCHAR(100) DEFAULT NULL,
  `guest_count` INT DEFAULT 0,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings Table
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'declined', 'completed') DEFAULT 'pending',
  `agreed_price` DECIMAL(10, 2) DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews Table
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT DEFAULT NULL,
  `customer_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Seed Data for Demo
-- Password for all seed users: "password123" (hashed via bcrypt)
-- $2a$10$7R0wU/M5E16W2y/3Kq4P7.s19Z87/cT6.vGgS5KjA5l0YpY5A2zX. (dummy hash or initialized)

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`) VALUES
(1, 'אדמין המערכת', 'admin@eventhub.co.il', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O system', 'admin', '050-0000000'),
(2, 'רועי שחר (צלם)', 'roey@studioshahar.co.il', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O', 'vendor', '052-1234567'),
(3, 'DJ דניאל גולן', 'daniel@djgolan.co.il', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O', 'vendor', '054-9876543'),
(4, 'שף דוד פרידמן - קייטרינג', 'chef@gourmet.co.il', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O', 'vendor', '053-5554433'),
(5, 'גני אליסיה - מקום לאירועים', 'info@elysia.co.il', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O', 'vendor', '050-7778899'),
(6, 'מיכל כהן (לקוחה)', 'michal@gmail.com', '$2a$10$w4oF./bCExHh05v41b.Wp.1d84bK1Kx1B6A2/KzB3fW/wG/Vf0O', 'customer', '054-1112233');

INSERT INTO `vendors` (`id`, `user_id`, `business_name`, `category`, `description`, `location`, `starting_price`, `is_approved`, `rating_avg`, `review_count`) VALUES
(1, 2, 'סטודיו שחר צילום אירועים', 'photography', 'צילום סטילס ווידאו אומנותי לאירועים מרגשים. ניסיון של 10 שנים בתחום.', 'תל אביב והמרכז', 4500.00, TRUE, 4.90, 18),
(2, 3, 'DJ Daniel Golan - מוזיקה ולאירועים', 'dj_music', 'סטים ייחודיים שמובילים את הרחבה. מוזיקה מותאמת אישית לכל זוג ואירוע.', 'מרכז ושרון', 3800.00, TRUE, 4.85, 24),
(3, 4, 'גורמה פרידמן - קייטרינג שף', 'catering', 'חוויה קולינרית בלתי נשכחת. תפריט שף בשרי וצמחוני ברמה הגבוהה ביותר.', 'ירושלים והסביבה', 180.00, TRUE, 5.00, 12),
(4, 5, 'גני אליסיה - מתחם אירועים קסום', 'venue', 'מתחם אירועים יוקרתי בלב הטבע עם גן פתוח ואולם מעוצב לעד 500 אורחים.', 'שפלה ודרום', 15000.00, TRUE, 4.95, 30);

INSERT INTO `events` (`id`, `customer_id`, `title`, `event_type`, `event_date`, `budget`, `location`, `guest_count`, `notes`) VALUES
(1, 6, 'חתונה של מיכל ויונתן', 'חתונה', '2026-09-15', 80000.00, 'מרכז', 250, 'מחפשים אווירה יוקרתית וצעירה');
