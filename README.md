# 🎓 SchoolHub — Web-Based System for School Activities, Events & Academic Scheduling

A full-stack web application for managing school activities, events, academic schedules, and announcements.

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS      |
| Backend     | Node.js + Express.js                |
| Database    | SQLite (via better-sqlite3)         |
| Auth        | JWT (jsonwebtoken) + bcryptjs       |
| HTTP Client | Axios                               |
| Date Utils  | date-fns                            |

---

## 📁 Project Structure

```
school-system/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT auth middleware
│   ├── db.js                # SQLite setup + seed data
│   ├── server.js            # Express REST API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx   # Sidebar + navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── ActivitiesPage.jsx
│   │   │   ├── SchedulesPage.jsx
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   └── UsersPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev         # with nodemon (auto-reload)
# OR
node server.js      # without nodemon
```

Backend runs at: **http://localhost:3001**  
The SQLite database (`school.db`) is auto-created with seed data on first run.

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔐 Demo Accounts

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@school.edu        | admin123     |
| Teacher | sarah@school.edu        | teacher123   |
| Student | student1@school.edu     | student123   |

---

## ✨ Features

### 📅 Events Management
- Create, edit, delete school events (academic, cultural, sports, holiday, meeting)
- Event registration for students/teachers
- View participant lists
- Filter by type, status, or registered events

### 🏃 Activities Management
- Club/organization management with member tracking
- Join/leave activities
- Filter by category (club, sports, arts, academic, volunteer)
- Coordinator assignment

### 🗓 Academic Scheduling
- **Timetable view** — visual weekly grid showing all classes
- **List view** — sortable table with all schedule entries
- Room conflict detection (prevents double-booking)
- Filter by grade, section, and teacher
- Color-coded subjects for easy reading

### 📢 Announcements
- Priority levels: Low, Normal, High, Urgent
- Target audience: All, Students only, Teachers only
- Optional expiry dates
- Color-coded priority banners

### 👥 User Management (Admin)
- Create accounts for admins, teachers, students
- Role-based access control
- Department assignment
- User statistics dashboard

### 🏠 Dashboard
- Live stats: students, teachers, events, activities
- Upcoming events feed
- Recent announcements feed

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint          | Access        |
|--------|-------------------|---------------|
| POST   | /api/auth/login   | Public        |
| POST   | /api/auth/register| Admin only    |
| GET    | /api/auth/me      | Authenticated |

### Events
| Method | Endpoint                    | Access           |
|--------|-----------------------------|------------------|
| GET    | /api/events                 | All              |
| GET    | /api/events/:id             | All              |
| POST   | /api/events                 | Admin, Teacher   |
| PUT    | /api/events/:id             | Admin, Teacher   |
| DELETE | /api/events/:id             | Admin only       |
| POST   | /api/events/:id/register    | All              |
| DELETE | /api/events/:id/register    | All              |

### Activities
| Method | Endpoint                    | Access           |
|--------|-----------------------------|------------------|
| GET    | /api/activities             | All              |
| POST   | /api/activities             | Admin, Teacher   |
| PUT    | /api/activities/:id         | Admin, Teacher   |
| DELETE | /api/activities/:id         | Admin only       |
| POST   | /api/activities/:id/join    | All              |
| DELETE | /api/activities/:id/join    | All              |

### Schedules
| Method | Endpoint            | Access           |
|--------|---------------------|------------------|
| GET    | /api/schedules      | All (with filters)|
| POST   | /api/schedules      | Admin, Teacher   |
| PUT    | /api/schedules/:id  | Admin, Teacher   |
| DELETE | /api/schedules/:id  | Admin only       |

### Announcements
| Method | Endpoint                  | Access           |
|--------|---------------------------|------------------|
| GET    | /api/announcements        | All              |
| POST   | /api/announcements        | Admin, Teacher   |
| DELETE | /api/announcements/:id    | Admin, Teacher   |

### Dashboard
| Method | Endpoint               | Access |
|--------|------------------------|--------|
| GET    | /api/dashboard/stats   | All    |

---

## 🔒 Role Permissions

| Feature              | Admin | Teacher | Student |
|----------------------|:-----:|:-------:|:-------:|
| View all pages       | ✅    | ✅      | ✅      |
| Create/edit events   | ✅    | ✅      | ❌      |
| Delete events        | ✅    | ❌      | ❌      |
| Create activities    | ✅    | ✅      | ❌      |
| Create schedules     | ✅    | ✅      | ❌      |
| Post announcements   | ✅    | ✅      | ❌      |
| Manage users         | ✅    | ❌      | ❌      |
| Register for events  | ✅    | ✅      | ✅      |
| Join activities      | ✅    | ✅      | ✅      |

---

## 🗃 Database Schema

- **users** — name, email, hashed password, role, department
- **events** — title, description, type, dates, location, organizer, participants
- **event_participants** — many-to-many: users ↔ events
- **activities** — name, category, coordinator, schedule, room, max members
- **activity_members** — many-to-many: users ↔ activities
- **schedules** — subject, teacher, grade, section, day, time, room, semester
- **announcements** — title, content, priority, target role, expiry

---

## 🧩 Extending the System

- Add a **grades module** for recording student scores
- Add **email notifications** via nodemailer
- Add **file uploads** for event posters and activity materials
- Add **calendar export** (iCal) for schedules
- Deploy frontend to **Vercel** and backend to **Railway** or **Render**
- Replace SQLite with **PostgreSQL** for production scale

---

Made with ❤️ — SchoolHub Management System
