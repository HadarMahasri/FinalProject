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
  `event_type` VARCHAR(50) NOT NULL,
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

-- Initial Seed Data for Demo (Password for all seed users: "password123")
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`) VALUES
(1, 'אדמין המערכת', 'admin@eventhub.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'admin', '050-0000000'),
(2, 'רועי שחר (צלם)', 'roey@studioshahar.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '052-1234567'),
(3, 'DJ דניאל גולן', 'daniel@djgolan.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '054-9876543'),
(4, 'שף דוד פרידמן - קייטרינג', 'chef@gourmet.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '053-5554433'),
(5, 'גני אליסיה - מקום לאירועים', 'info@elysia.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '050-7778899'),
(6, 'מיכל כהן (לקוחה)', 'michal@gmail.com', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'customer', '054-1112233'),
(7, 'לירון (Camera)', 'liron@gmail.com', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '054-3846482'),
(8, 'הדר מהסרי', 'hadarhadar690@gmail.com', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'customer', '050-1234567'),
(9, 'פלורנטין עיצוב & פרחים', 'florentin@flowers.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '052-8889900'),
(10, 'אורלי זיקוקין & אטרקציות', 'orili@attractions.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '054-4443322'),
(11, 'אלון סקסופון & הרכב ג\'אז', 'alon.sax@music.co.il', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'vendor', '050-6667788'),
(12, 'דן לוי (לקוח)', 'dan.levi@gmail.com', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'customer', '052-5551234'),
(13, 'שרה גולדשטיין (לקוחה)', 'sarah.gold@gmail.com', '$2b$10$Lov3U.S1zUbeX8MipRmgMOj8c.93/XgY3pfQtG/Y/faBI17MzrU.6', 'customer', '053-9998877');

INSERT INTO `vendors` (`id`, `user_id`, `business_name`, `category`, `description`, `location`, `starting_price`, `is_approved`, `cover_image`, `rating_avg`, `review_count`) VALUES
(1, 2, 'סטודיו שחר צילום אירועים', 'photography', 'צילום סטילס ווידאו אומנותי לאירועים מרגשים. ניסיון של 10 שנים בתחום החתונות והאירועים הפרטיים.', 'תל אביב והמרכז', 4500.00, TRUE, NULL, 4.90, 18),
(2, 3, 'DJ Daniel Golan - מוזיקה לאירועים', 'dj_music', 'סטים ייחודיים שמובילים את הרחבה. מוזיקה מותאמת אישית לכל זוג, חתונה ובר מצווה.', 'מרכז ושרון', 3800.00, TRUE, NULL, 4.85, 24),
(3, 4, 'גורמה פרידמן - קייטרינג שף', 'catering', 'חוויה קולינרית בלתי נשכחת. תפריט שף בשרי וצמחוני ברמה הגבוהה ביותר עם חומרי גלם מובחרים.', 'ירושלים והסביבה', 180.00, TRUE, NULL, 5.00, 12),
(4, 5, 'גני אליסיה - מתחם אירועים קסום', 'venue', 'מתחם אירועים יוקרתי בלב הטבע עם גן פתוח ואולם מעוצב לעד 500 אורחים.', 'שפלה ודרום', 15000.00, TRUE, NULL, 4.95, 30),
(5, 7, 'Camera', 'photography', 'חי צילום, צלם סטילס וחתונות ברמה בינלאומית. לכידת הרגעים המרגשים ביותר.', 'תל אביב והמרכז', 12000.00, TRUE, '/uploads/media-1785408413723-970530675.jpeg', 5.00, 3),
(6, 8, 'פלורנטין עיצוב אירועים & שזירת פרחים', 'design_flowers', 'עיצוב חופות, שולחנות וזרי כלה יוקרתיים. עיצוב פרחים חיים בעיצוב אישי לאירוע חלומי.', 'תל אביב והמרכז', 2500.00, TRUE, NULL, 4.90, 8),
(7, 9, 'אורלי זיקוקין & אטרקציות לאירועים', 'other', 'זיקוקי דינור, עשן כבד לסלואו, בועות סבון, קיר צילום ואותיות מוארות לחתונה ובר מצווה.', 'כל הארץ', 1800.00, TRUE, NULL, 4.80, 15),
(8, 10, 'אלון סקסופון & הרכב ג\'אז לקבלת פנים', 'dj_music', 'נגינת סקסופון בלייב בקבלת פנים ובחופה, יחד עם הרכב ג\'אז וקלאסיקות שקטות ומרגשות.', 'מרכז ושרון', 3200.00, TRUE, NULL, 5.00, 10);

INSERT INTO `media` (`id`, `vendor_id`, `file_path`, `file_type`) VALUES
(1, 5, '/uploads/media-1785408413723-970530675.jpeg', 'image'),
(2, 5, '/uploads/media-1785408420033-301426030.jpeg', 'image'),
(3, 5, '/uploads/media-1785408515522-760817811.jpeg', 'image'),
(4, 5, '/uploads/media-1785408647909-724436346.jpeg', 'image'),
(5, 5, '/uploads/media-1785409464943-904217528.jpeg', 'image'),
(6, 5, '/uploads/media-1785409481482-107321272.jpg', 'image');

INSERT INTO `events` (`id`, `customer_id`, `title`, `event_type`, `event_date`, `budget`, `location`, `guest_count`, `notes`) VALUES
(1, 6, 'חתונה של מיכל ויונתן', 'חתונה', '2026-09-15', 80000.00, 'מרכז', 250, 'מחפשים אווירה יוקרתית וצעירה'),
(2, 12, 'בר מצווה של איתי', 'בר / בת מצווה', '2026-10-20', 35000.00, 'השרון', 120, 'מוזיקה קצבית ואטרקציות לנוער'),
(3, 13, 'אירוע חברה שנתי - הייטק', 'אירוע חברה', '2026-11-05', 60000.00, 'תל אביב', 180, 'קבלת פנים עם מוזיקה חיה וקייטרינג שף'),
(4, 8, 'חתונה קסומה - הדר מהסרי', 'חתונה', '2026-12-10', 95000.00, 'מרכז', 300, 'פנייה מיוחדת ללירון צלם Camera עבור תיעוד מלא של יום החתונה והאירוע'),
(5, 8, 'מסיבת אירוסין קסומה - הדר מהסרי', 'מסיבת אירוסין', '2026-09-01', 25000.00, 'תל אביב', 80, 'חגיגת אירוסין אינטימית עם משפחה וחברים קרובים');

INSERT INTO `bookings` (`id`, `event_id`, `vendor_id`, `status`, `agreed_price`, `notes`) VALUES
(1, 1, 5, 'approved', 12000.00, 'שלום לירון! נשמח לצילום בחתונה שלנו ב-15 בספטמבר'),
(2, 2, 2, 'approved', 3800.00, 'בקשה לתקליטן עבור בר מצווה ב-20 באוקטובר'),
(3, 3, 8, 'pending', 3200.00, 'בקשה להרכב סקסופון בקבלת פנים לאירוע חברה'),
(4, 4, 5, 'pending', 12000.00, 'שלום לירון! אהבנו מאוד את תמונות הסטודיו שלך. נשמח לסגור איתך צילום סטילס ווידאו לחתונה שלנו ב-10 בדצמבר!');

INSERT INTO `reviews` (`id`, `booking_id`, `customer_id`, `vendor_id`, `rating`, `comment`) VALUES
(1, 1, 6, 5, 5, 'לירון מ-Camera הוא הצלם הכי תותח שפגשנו! היחס האישי, הסבלנות והתמונות שיוצאות מהמצלמה שלו הן פשוט יצירת אמנות. מומלץ ביותר לכל מי שרוצה מזכרת מטורפת מהחתונה!'),
(2, NULL, 13, 5, 5, 'איכות הצילום והזוויות של לירון פשוט מדהימות. הוא תיעד את האירוע שלנו בצורה הכי טבעית ומרגשת שיש, בלי להפריע לאורחים. תודה ענקית!'),
(3, 2, 12, 2, 5, 'DJ דניאל גולן הרים את הרחבה! כל הילדים והמבוגרים רקדו ללא הפסקה בבר מצווה. תודה רבה!'),
(4, NULL, 12, 5, 5, 'מקצוען אמיתי! הגיע בזמן, נתן תחושה רגועה וכיפית לאורך כל היום והאלבום יצא פשוט מושלם.');
