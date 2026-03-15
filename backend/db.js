const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'school.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin','teacher','student')) DEFAULT 'student',
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT CHECK(type IN ('academic','cultural','sports','holiday','meeting','other')) DEFAULT 'other',
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      location TEXT,
      organizer_id INTEGER REFERENCES users(id),
      max_participants INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('upcoming','ongoing','completed','cancelled')) DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK(category IN ('club','sports','arts','academic','volunteer','other')) DEFAULT 'other',
      coordinator_id INTEGER REFERENCES users(id),
      schedule TEXT,
      meeting_day TEXT,
      meeting_time TEXT,
      room TEXT,
      max_members INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('active','inactive','suspended')) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      role TEXT DEFAULT 'member',
      UNIQUE(activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_id INTEGER REFERENCES users(id),
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      semester TEXT,
      school_year TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id),
      priority TEXT CHECK(priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
      target_role TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
  `);

  // Seed admin user if none exists
  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role, department) VALUES (?,?,?,?,?)`)
      .run('Admin User', 'admin@school.edu', hash, 'admin', 'Administration');

    const teacherHash = bcrypt.hashSync('teacher123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role, department) VALUES (?,?,?,?,?)`)
      .run('Ms. Sarah Cruz', 'sarah@school.edu', teacherHash, 'teacher', 'Mathematics');
    db.prepare(`INSERT INTO users (name, email, password, role, department) VALUES (?,?,?,?,?)`)
      .run('Mr. Jose Santos', 'jose@school.edu', teacherHash, 'teacher', 'Science');
    db.prepare(`INSERT INTO users (name, email, password, role, department) VALUES (?,?,?,?,?)`)
      .run('Ms. Ana Reyes', 'ana@school.edu', teacherHash, 'teacher', 'English');

    const studentHash = bcrypt.hashSync('student123', 10);
    ['Juan dela Cruz', 'Maria Garcia', 'Pedro Bautista', 'Liza Tan', 'Miguel Lopez'].forEach((name, i) => {
      db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)`)
        .run(name, `student${i+1}@school.edu`, studentHash, 'student');
    });

    // Seed events
    const now = new Date();
    const events = [
      ['Foundation Day 2024', 'Annual school foundation day celebration with activities for all students.', 'cultural',
       '2024-09-15 08:00', '2024-09-15 17:00', 'School Grounds', 1, 500, 'completed'],
      ['Science Fair', 'Annual science fair showcasing student projects and innovations.', 'academic',
       '2025-03-20 08:00', '2025-03-20 16:00', 'Gymnasium', 2, 200, 'upcoming'],
      ['Intramurals 2025', 'Interschool sports competition featuring basketball, volleyball, and more.', 'sports',
       '2025-04-10 07:00', '2025-04-14 17:00', 'Sports Complex', 3, 0, 'upcoming'],
      ['PTA General Assembly', 'Meeting with parents and teachers for school updates.', 'meeting',
       '2025-02-28 14:00', '2025-02-28 17:00', 'Auditorium', 1, 300, 'upcoming'],
      ['Math Olympiad', 'Regional mathematics competition for Grade 9-12 students.', 'academic',
       '2025-03-05 08:00', '2025-03-05 12:00', 'Room 201', 2, 50, 'upcoming'],
      ['Buwan ng Wika', 'Celebration of Filipino language and culture.', 'cultural',
       '2025-08-20 08:00', '2025-08-22 17:00', 'School Grounds', 3, 0, 'upcoming'],
    ];
    events.forEach(([title, desc, type, start, end, loc, org, max, status]) => {
      db.prepare(`INSERT INTO events (title,description,type,start_date,end_date,location,organizer_id,max_participants,status) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(title, desc, type, start, end, loc, org, max, status);
    });

    // Seed activities
    const activities = [
      ['Math Club', 'Problem solving and competitive math preparation.', 'academic', 2, 'Every Tuesday 3PM', 'Tuesday', '15:00', 'Room 103', 30],
      ['Science Explorers', 'Hands-on science experiments and research.', 'academic', 3, 'Every Wednesday 3PM', 'Wednesday', '15:00', 'Science Lab', 25],
      ['Basketball Varsity', 'School basketball team, training and competitions.', 'sports', 3, 'Mon/Wed/Fri 4PM', 'Monday', '16:00', 'Gymnasium', 15],
      ['Drama Club', 'Acting, stagecraft and theatrical productions.', 'arts', 4, 'Every Thursday 3PM', 'Thursday', '15:00', 'Auditorium', 40],
      ['Student Publication', 'School newspaper and media production.', 'club', 4, 'Every Friday 2PM', 'Friday', '14:00', 'Room 108', 20],
      ['Community Service', 'Volunteer outreach and community programs.', 'volunteer', 1, 'Every Saturday 8AM', 'Saturday', '08:00', 'TBD', 50],
    ];
    activities.forEach(([name, desc, cat, coord, sched, day, time, room, max]) => {
      db.prepare(`INSERT INTO activities (name,description,category,coordinator_id,schedule,meeting_day,meeting_time,room,max_members) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(name, desc, cat, coord, sched, day, time, room, max);
    });

    // Seed schedules
    const schedules = [
      ['Mathematics 9', 'Mathematics', 2, 'Grade 9', 'Section A', 'Monday', '07:30', '08:30', 'Room 101', '1st Semester', '2024-2025'],
      ['Mathematics 9', 'Mathematics', 2, 'Grade 9', 'Section A', 'Wednesday', '07:30', '08:30', 'Room 101', '1st Semester', '2024-2025'],
      ['Mathematics 9', 'Mathematics', 2, 'Grade 9', 'Section A', 'Friday', '07:30', '08:30', 'Room 101', '1st Semester', '2024-2025'],
      ['Science 10', 'Science', 3, 'Grade 10', 'Section B', 'Tuesday', '09:00', '10:00', 'Science Lab', '1st Semester', '2024-2025'],
      ['Science 10', 'Science', 3, 'Grade 10', 'Section B', 'Thursday', '09:00', '10:00', 'Science Lab', '1st Semester', '2024-2025'],
      ['English 11', 'English', 4, 'Grade 11', 'Section C', 'Monday', '10:00', '11:00', 'Room 205', '1st Semester', '2024-2025'],
      ['English 11', 'English', 4, 'Grade 11', 'Section C', 'Wednesday', '10:00', '11:00', 'Room 205', '1st Semester', '2024-2025'],
      ['English 11', 'English', 4, 'Grade 11', 'Section C', 'Friday', '10:00', '11:00', 'Room 205', '1st Semester', '2024-2025'],
      ['Mathematics 10', 'Mathematics', 2, 'Grade 10', 'Section A', 'Tuesday', '07:30', '08:30', 'Room 102', '1st Semester', '2024-2025'],
      ['Mathematics 10', 'Mathematics', 2, 'Grade 10', 'Section A', 'Thursday', '07:30', '08:30', 'Room 102', '1st Semester', '2024-2025'],
    ];
    schedules.forEach(([title, subj, teacher, grade, section, day, start, end, room, sem, year]) => {
      db.prepare(`INSERT INTO schedules (title,subject,teacher_id,grade,section,day_of_week,start_time,end_time,room,semester,school_year) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(title, subj, teacher, grade, section, day, start, end, room, sem, year);
    });

    // Seed announcements
    db.prepare(`INSERT INTO announcements (title,content,author_id,priority,target_role) VALUES (?,?,?,?,?)`)
      .run('Welcome Back to School!', 'Welcome students and teachers to the new school year 2024-2025. Let us make this year productive and memorable!', 1, 'high', 'all');
    db.prepare(`INSERT INTO announcements (title,content,author_id,priority,target_role) VALUES (?,?,?,?,?)`)
      .run('Enrollment for 2nd Semester Now Open', 'Enrollment for the second semester is now open. Please see the registrar for requirements and schedules.', 1, 'urgent', 'student');
    db.prepare(`INSERT INTO announcements (title,content,author_id,priority,target_role) VALUES (?,?,?,?,?)`)
      .run('Submission of Grades Deadline', 'All teachers must submit final grades by February 28, 2025. Please coordinate with the registrar.', 1, 'urgent', 'teacher');

    console.log('✅ Database seeded successfully');
  }
}

initDB();
module.exports = db;
