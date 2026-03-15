const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { auth, requireRole, SECRET } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
});

app.post('/api/auth/register', auth, requireRole('admin'), (req, res) => {
  const { name, email, password, role, department } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)').run(name, email, hash, role || 'student', department || '');
    res.json({ id: result.lastInsertRowid, message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,department,created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get('/api/users', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { role } = req.query;
  let query = 'SELECT id,name,email,role,department,created_at FROM users';
  const params = [];
  if (role) { query += ' WHERE role = ?'; params.push(role); }
  query += ' ORDER BY name';
  res.json(db.prepare(query).all(...params));
});

app.delete('/api/users/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── EVENTS ──────────────────────────────────────────────────────────────────

app.get('/api/events', auth, (req, res) => {
  const events = db.prepare(`
    SELECT e.*, u.name AS organizer_name,
    (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) AS participant_count,
    EXISTS(SELECT 1 FROM event_participants WHERE event_id = e.id AND user_id = ?) AS is_registered
    FROM events e LEFT JOIN users u ON e.organizer_id = u.id
    ORDER BY e.start_date DESC
  `).all(req.user.id);
  res.json(events);
});

app.get('/api/events/:id', auth, (req, res) => {
  const event = db.prepare(`
    SELECT e.*, u.name AS organizer_name,
    (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) AS participant_count
    FROM events e LEFT JOIN users u ON e.organizer_id = u.id WHERE e.id = ?
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  const participants = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, ep.registered_at
    FROM event_participants ep JOIN users u ON ep.user_id = u.id WHERE ep.event_id = ?
  `).all(req.params.id);
  res.json({ ...event, participants });
});

app.post('/api/events', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { title, description, type, start_date, end_date, location, max_participants } = req.body;
  const result = db.prepare(`INSERT INTO events (title,description,type,start_date,end_date,location,organizer_id,max_participants) VALUES (?,?,?,?,?,?,?,?)`)
    .run(title, description, type || 'other', start_date, end_date, location, req.user.id, max_participants || 0);
  res.json({ id: result.lastInsertRowid, message: 'Event created' });
});

app.put('/api/events/:id', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { title, description, type, start_date, end_date, location, max_participants, status } = req.body;
  db.prepare(`UPDATE events SET title=?,description=?,type=?,start_date=?,end_date=?,location=?,max_participants=?,status=? WHERE id=?`)
    .run(title, description, type, start_date, end_date, location, max_participants, status, req.params.id);
  res.json({ message: 'Updated' });
});

app.delete('/api/events/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/events/:id/register', auth, (req, res) => {
  try {
    db.prepare('INSERT INTO event_participants (event_id, user_id) VALUES (?,?)').run(req.params.id, req.user.id);
    res.json({ message: 'Registered successfully' });
  } catch {
    res.status(400).json({ error: 'Already registered' });
  }
});

app.delete('/api/events/:id/register', auth, (req, res) => {
  db.prepare('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Unregistered' });
});

// ─── ACTIVITIES ────────────────────────────────────────────────────────────────

app.get('/api/activities', auth, (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, u.name AS coordinator_name,
    (SELECT COUNT(*) FROM activity_members WHERE activity_id = a.id) AS member_count,
    EXISTS(SELECT 1 FROM activity_members WHERE activity_id = a.id AND user_id = ?) AS is_member
    FROM activities a LEFT JOIN users u ON a.coordinator_id = u.id
    ORDER BY a.name
  `).all(req.user.id);
  res.json(activities);
});

app.post('/api/activities', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { name, description, category, schedule, meeting_day, meeting_time, room, max_members } = req.body;
  const result = db.prepare(`INSERT INTO activities (name,description,category,coordinator_id,schedule,meeting_day,meeting_time,room,max_members) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(name, description, category || 'other', req.user.id, schedule, meeting_day, meeting_time, room, max_members || 0);
  res.json({ id: result.lastInsertRowid, message: 'Activity created' });
});

app.put('/api/activities/:id', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { name, description, category, schedule, meeting_day, meeting_time, room, max_members, status } = req.body;
  db.prepare(`UPDATE activities SET name=?,description=?,category=?,schedule=?,meeting_day=?,meeting_time=?,room=?,max_members=?,status=? WHERE id=?`)
    .run(name, description, category, schedule, meeting_day, meeting_time, room, max_members, status, req.params.id);
  res.json({ message: 'Updated' });
});

app.delete('/api/activities/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/activities/:id/join', auth, (req, res) => {
  try {
    db.prepare('INSERT INTO activity_members (activity_id, user_id) VALUES (?,?)').run(req.params.id, req.user.id);
    res.json({ message: 'Joined successfully' });
  } catch {
    res.status(400).json({ error: 'Already a member' });
  }
});

app.delete('/api/activities/:id/join', auth, (req, res) => {
  db.prepare('DELETE FROM activity_members WHERE activity_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Left activity' });
});

// ─── SCHEDULES ────────────────────────────────────────────────────────────────

app.get('/api/schedules', auth, (req, res) => {
  const { grade, section, teacher_id, day } = req.query;
  let query = `SELECT s.*, u.name AS teacher_name FROM schedules s LEFT JOIN users u ON s.teacher_id = u.id WHERE 1=1`;
  const params = [];
  if (grade) { query += ' AND s.grade = ?'; params.push(grade); }
  if (section) { query += ' AND s.section = ?'; params.push(section); }
  if (teacher_id) { query += ' AND s.teacher_id = ?'; params.push(teacher_id); }
  if (day) { query += ' AND s.day_of_week = ?'; params.push(day); }
  query += ' ORDER BY CASE s.day_of_week WHEN "Monday" THEN 1 WHEN "Tuesday" THEN 2 WHEN "Wednesday" THEN 3 WHEN "Thursday" THEN 4 WHEN "Friday" THEN 5 WHEN "Saturday" THEN 6 ELSE 7 END, s.start_time';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/schedules', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { title, subject, teacher_id, grade, section, day_of_week, start_time, end_time, room, semester, school_year } = req.body;
  // Conflict check
  const conflict = db.prepare(`
    SELECT id FROM schedules
    WHERE room = ? AND day_of_week = ? AND semester = ? AND school_year = ?
    AND NOT (end_time <= ? OR start_time >= ?)
  `).get(room, day_of_week, semester, school_year, start_time, end_time);
  if (conflict) return res.status(409).json({ error: 'Room is already booked at this time' });
  const result = db.prepare(`INSERT INTO schedules (title,subject,teacher_id,grade,section,day_of_week,start_time,end_time,room,semester,school_year) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(title, subject, teacher_id || req.user.id, grade, section, day_of_week, start_time, end_time, room, semester, school_year);
  res.json({ id: result.lastInsertRowid, message: 'Schedule created' });
});

app.put('/api/schedules/:id', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { title, subject, teacher_id, grade, section, day_of_week, start_time, end_time, room, semester, school_year } = req.body;
  db.prepare(`UPDATE schedules SET title=?,subject=?,teacher_id=?,grade=?,section=?,day_of_week=?,start_time=?,end_time=?,room=?,semester=?,school_year=? WHERE id=?`)
    .run(title, subject, teacher_id, grade, section, day_of_week, start_time, end_time, room, semester, school_year, req.params.id);
  res.json({ message: 'Updated' });
});

app.delete('/api/schedules/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

app.get('/api/announcements', auth, (req, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.name AS author_name FROM announcements a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE (a.target_role = 'all' OR a.target_role = ? OR ? = 'admin')
    AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
    ORDER BY a.created_at DESC
  `).all(req.user.role, req.user.role);
  res.json(announcements);
});

app.post('/api/announcements', auth, requireRole('admin', 'teacher'), (req, res) => {
  const { title, content, priority, target_role, expires_at } = req.body;
  const result = db.prepare(`INSERT INTO announcements (title,content,author_id,priority,target_role,expires_at) VALUES (?,?,?,?,?,?)`)
    .run(title, content, req.user.id, priority || 'normal', target_role || 'all', expires_at || null);
  res.json({ id: result.lastInsertRowid, message: 'Announcement created' });
});

app.delete('/api/announcements/:id', auth, requireRole('admin', 'teacher'), (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

app.get('/api/dashboard/stats', auth, (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    total_students: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student"').get().c,
    total_teachers: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "teacher"').get().c,
    upcoming_events: db.prepare('SELECT COUNT(*) as c FROM events WHERE status = "upcoming"').get().c,
    active_activities: db.prepare('SELECT COUNT(*) as c FROM activities WHERE status = "active"').get().c,
    total_schedules: db.prepare('SELECT COUNT(*) as c FROM schedules').get().c,
    recent_announcements: db.prepare('SELECT COUNT(*) as c FROM announcements').get().c,
    my_events: db.prepare('SELECT COUNT(*) as c FROM event_participants WHERE user_id = ?').get(req.user.id).c,
    my_activities: db.prepare('SELECT COUNT(*) as c FROM activity_members WHERE user_id = ?').get(req.user.id).c,
  };
  const upcoming = db.prepare(`
    SELECT id,title,type,start_date,location FROM events
    WHERE status = 'upcoming' ORDER BY start_date LIMIT 5
  `).all();
  const recent_ann = db.prepare(`
    SELECT a.id,a.title,a.priority,a.created_at,u.name AS author_name
    FROM announcements a LEFT JOIN users u ON a.author_id = u.id
    ORDER BY a.created_at DESC LIMIT 5
  `).all();
  res.json({ stats, upcoming_events: upcoming, recent_announcements: recent_ann });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 School System API running on port ${PORT}`));
