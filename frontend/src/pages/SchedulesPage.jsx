import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const subjectColors = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-amber-100 border-amber-300 text-amber-800',
];

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const empty = { title: '', subject: '', teacher_id: '', grade: 'Grade 7', section: 'Section A', day_of_week: 'Monday', start_time: '07:30', end_time: '08:30', room: '', semester: '1st Semester', school_year: '2024-2025' };

export default function SchedulesPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [view, setView] = useState('timetable');
  const [filters, setFilters] = useState({ grade: '', section: '', teacher_id: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const load = () => {
    const params = new URLSearchParams();
    if (filters.grade) params.set('grade', filters.grade);
    if (filters.section) params.set('section', filters.section);
    if (filters.teacher_id) params.set('teacher_id', filters.teacher_id);
    axios.get(`/api/schedules?${params}`).then(r => setSchedules(r.data));
  };

  useEffect(() => {
    load();
    axios.get('/api/users?role=teacher').then(r => setTeachers(r.data));
  }, []);

  useEffect(() => { load(); }, [filters]);

  // Build color map by subject
  const subjectMap = {};
  let colorIdx = 0;
  schedules.forEach(s => {
    if (!subjectMap[s.subject]) subjectMap[s.subject] = subjectColors[colorIdx++ % subjectColors.length];
  });

  const getSchedulesForSlot = (day, hour) => {
    return schedules.filter(s => {
      if (s.day_of_week !== day) return false;
      const start = timeToMinutes(s.start_time);
      const end = timeToMinutes(s.end_time);
      const slotStart = timeToMinutes(hour);
      return start >= slotStart && start < slotStart + 60;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) await axios.put(`/api/schedules/${editing}`, form);
      else await axios.post('/api/schedules', form);
      setShowModal(false); setEditing(null); setForm(empty); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this schedule?')) return;
    await axios.delete(`/api/schedules/${id}`); load();
  };

  const openEdit = (s) => {
    setForm({ ...s, teacher_id: s.teacher_id || '' });
    setEditing(s.id); setShowModal(true);
  };

  const grades = ['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
  const sections = ['Section A','Section B','Section C','Section D','Section E'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Schedules</h1>
          <p className="text-gray-500 text-sm mt-1">{schedules.length} schedules</p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {['timetable','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === v ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {canEdit && <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setError(''); setShowModal(true); }}>+ Add Schedule</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
          <select className="input text-sm py-1.5" style={{width:'140px'}} value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))}>
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
          <select className="input text-sm py-1.5" style={{width:'140px'}} value={filters.section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(user?.role === 'admin') && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Teacher</label>
            <select className="input text-sm py-1.5" style={{width:'180px'}} value={filters.teacher_id} onChange={e => setFilters(f => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <button className="btn-secondary btn-sm" onClick={() => setFilters({ grade: '', section: '', teacher_id: '' })}>Clear</button>
        </div>
      </div>

      {/* Timetable View */}
      {view === 'timetable' && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-xs font-medium text-gray-500 w-20">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="text-left p-3 text-xs font-medium text-gray-500">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hi) => (
                <tr key={hour} className={`border-b border-gray-100 ${hi % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                  <td className="p-2 text-xs text-gray-400 font-medium align-top">{hour}</td>
                  {DAYS.map(day => {
                    const slots = getSchedulesForSlot(day, hour);
                    return (
                      <td key={day} className="p-1 align-top min-w-[120px]">
                        {slots.map(s => (
                          <div key={s.id} className={`rounded-lg border p-2 mb-1 text-xs cursor-pointer hover:opacity-80 ${subjectMap[s.subject]}`}
                            onClick={() => openEdit(s)}>
                            <p className="font-semibold truncate">{s.subject}</p>
                            <p className="opacity-75 truncate">{s.grade} {s.section}</p>
                            <p className="opacity-75">{s.start_time}–{s.end_time}</p>
                            {s.room && <p className="opacity-60 truncate">{s.room}</p>}
                            {s.teacher_name && <p className="opacity-75 truncate">{s.teacher_name}</p>}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Subject','Grade & Section','Day','Time','Room','Teacher',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`badge border ${subjectMap[s.subject]}`}>{s.subject}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.grade} — {s.section}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.day_of_week}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.start_time} – {s.end_time}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.room || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.teacher_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canEdit && <button className="text-xs text-blue-600 hover:underline" onClick={() => openEdit(s)}>Edit</button>}
                      {user?.role === 'admin' && <button className="text-xs text-red-500 hover:underline" onClick={() => del(s.id)}>Del</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No schedules found. Adjust filters or add a new schedule.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Schedule' : 'Add Schedule'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={save} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select className="input" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select className="input" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select className="input" value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select className="input" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input className="input" type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input className="input" type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input className="input" placeholder="e.g. Room 101" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  {['1st Semester','2nd Semester','Summer'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                <input className="input" placeholder="2024-2025" value={form.school_year} onChange={e => setForm(f => ({ ...f, school_year: e.target.value }))} required />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Save Schedule</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
