# 🌟 EventHub - פלטפורמה חכמה לתיאום אירועים וספקים (Full-Stack Final Project)

פרויקט מסכם בקורס **Full-Stack Web Development** (שנת הלימודים תשפ"ו - המרכז האקדמי לב).

המערכת הינה אפליקציית Web מלאה (End-to-End) המקשרת בין **מארגני אירועים / לקוחות**, **ספקי שירות** (צלמים, דיג'יי, קייטרינג, אולמות), ו**מנהלי מערכת (Admin)**, כולל ייעוץ תקציבי חכם מבוסס AI.

---

## 🛠️ טכנולוגיות וארכיטקטורה

- **צד הלקוח (Frontend)**: React, React Router v6, Lucide Icons, Vanilla CSS (Design System רספונסיבי מלא ל-Desktop ול-Mobile).
- **צד השרת (Backend)**: Node.js, Express (ארכיטקטורת MVC מודולרית: Routes, Controllers, Services, Models, Middleware).
- **מסד נתונים (Database)**: MySQL (סכמת טבלאות מתוכננת יחסית עם קשרים מוגדרים).
- **אימות והרשאות**: אימות משתמשים עם **JWT (JSON Web Tokens)**, הצפנת סיסמאות ב-Bcrypt.
- **ניהול קבצים ומדיה**: העלאת תמונות וקבצים לשרת באמצעות **Multer**.
- **אינטגרציית AI**: רכיב Smart Event Assistant לתכנון תקציב וחלוקת ספקים אופטימלית.

---

## 🚀 הוראות הרצה (Step-by-Step)

### 1. הקמת מסד הנתונים (MySQL)
1. פתחי את תוכנת ה-MySQL (MySQL Workbench / phpMyAdmin / CLI).
2. הרצי את הסקריפט הנמצא בנתיב:
   `backend/schema.sql`
   *(הסקריפט יוצר את בסיס הנתונים `eventhub_db`, הטבלאות הנדרשות ומזין נתוני דמו ראשוניים).*

---

### 2. הרצת השרת (Backend)
1. פתחי חלון טרמינל בתיקיית `backend`:
   ```bash
   cd backend
   npm run dev
   ```
2. השרת יעלה בכתובת: `http://localhost:5000`

---

### 3. הרצת צד הלקוח (Frontend)
1. פתחי חלון טרמינל נוסף בתיקיית `frontend`:
   ```bash
   cd frontend
   npm run dev
   ```
2. היישום ייפתח בדפדפן בכתובת: `http://localhost:5173`

---

## 🔑 משתמשי דמו לבדיקת המערכת

| תפקיד (Role) | אימייל | סיסמה | תיעוד |
| :--- | :--- | :--- | :--- |
| **לקוחה** | `michal@gmail.com` | `password123` | יצירת אירועים, שליחת בקשות תיאום, דירוג ספקים ושימוש ב-AI |
| **ספק צילום** | `roey@studioshahar.co.il` | `password123` | ניהול פניות נכנסות, עדכון מחירון, העלאת תמונות לגלריה |
| **אדמין** | `admin@eventhub.co.il` | `password123` | צפייה בסטטיסטיקות, אישור ספקים חדשים, ניהול משתמשים |

---

## 📂 מבנה התיקיות בפרויקט

```
FinalProject/
├── backend/
│   ├── schema.sql              # סקריפט הקמת בסיס נתונים MySQL ונתוני הדגמה
│   ├── .env                    # הגדרות פורט וקפתחות JWT/DB
│   ├── uploads/                 # תיקיית קבצי המדיה שהועלו לשרת (Multer)
│   └── src/
│       ├── config/              # חיבור ל-MySQL (db.js)
│       ├── controllers/         # לוגיקת ה-API (Auth, Vendor, Event, Review, AI, Admin)
│       ├── middleware/          # אימות JWT, הרשאות ותמיכה בהעלאת קבצים
│       ├── models/              # שאילתות MySQL מופרדות לפי ישות
│       ├── routes/              # נתיבי ה-REST API
│       └── index.js             # שרת ה-Express המרכזי
└── frontend/
    └── src/
        ├── components/          # רכיבי UI (Navbar, Footer, VendorCard, ProtectedRoute, AI Modal)
        ├── context/             # AuthContext לניהול התחברות ו-JWT בצד הלקוח
        ├── pages/               # דפי האפליקציה (Home, Catalog, VendorDetails, Dashboards, Auth)
        ├── services/            # עטיפת קריאות ה-API מול השרת (api.js)
        ├── App.jsx              # ניתוחי Routes והרשאות
        └── index.css            # מערכת עיצוב חדישה (Design System)
```
