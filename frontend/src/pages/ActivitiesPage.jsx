import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const categoryColors = {
  club: 'bg-purple-100 text-purple-800', sports: 'bg-orange-100 text-orange-800',
  arts: 'bg-pink-100 text-pink-800', academic: 'bg-blue-100 text-blue-800',
  volunteer: 'bg-green-100 text-green-800', other: 'bg-gray-100 text-gray-800',
};
const statusColors = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', suspended: 'bg-red-100 text-red-700',
};
const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

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

const empty = { name: '', description: '', category: 'other', schedule: '', meeting_day: 'Monday', meeting_time: '15:00', room: '', max_members: 0, status: 'active' };

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const load = () => axios.get('/api/activities').then(r => setActivities(r.data));
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? activities
    : filter === 'mine' ? activities.filter(a => a.is_member)
    : activities.filter(a => a.category === filter || a.status === filter);

  const save = async (e) => {
    e.preventDefault();
    if (editing) await axios.put(`/api/activities/${editing}`, form);
    else await axios.post('/api/activities', form);
    setShowModal(false); setEditing(null); setForm(empty); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this activity?')) return;
    await axios.delete(`/api/activities/${id}`); load();
  };

  const toggleJoin = async (act) => {
    if (act.is_member) await axios.delete(`/api/activities/${act.id}/join`);
    else await axios.post(`/api/activities/${act.id}/join`);
    load();
  };

  const openEdit = (act) => {
    setForm({ ...act });
    setEditing(act.id); setShowModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-500 text-sm mt-1">{activities.length} activities available</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setShowModal(true); }}>+ New Activity</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all','mine','active','club','sports','arts','academic','volunteer'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(act => (
          <div key={act.id} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className={`badge ${categoryColors[act.category]}`}>{act.category}</span>
                  <span className={`badge ${statusColors[act.status]}`}>{act.status}</span>
                </div>
                {act.is_member && <span className="badge bg-green-100 text-green-700">✓ Member</span>}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{act.name}</h3>
              {act.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{act.description}</p>}
              <div className="space-y-1.5 text-xs text-gray-500">
                {act.schedule && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {act.schedule}
                  </div>
                )}
                {act.room && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {act.room}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {act.member_count} members {act.max_members > 0 && `/ ${act.max_members} max`}
                </div>
                {act.coordinator_name && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {act.coordinator_name}
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-2">
              {act.status === 'active' && (
                <button onClick={() => toggleJoin(act)}
                  className={`btn-sm flex-1 rounded-lg font-medium transition-colors ${act.is_member ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'btn-primary'}`}>
                  {act.is_member ? 'Leave' : 'Join'}
                </button>
              )}
              {canEdit && <button className="btn-secondary btn-sm" onClick={() => openEdit(act)}>Edit</button>}
              {user?.role === 'admin' && (
                <button className="btn-sm rounded-lg text-red-600 border border-red-200 hover:bg-red-50 px-3" onClick={() => del(act.id)}>Del</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Activity' : 'New Activity'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['club','sports','arts','academic','volunteer','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['active','inactive','suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
                <select className="input" value={form.meeting_day} onChange={e => setForm(f => ({ ...f, meeting_day: e.target.value }))}>
                  {dayOrder.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
                <input className="input" type="time" value={form.meeting_time} onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Description</label>
              <input className="input" placeholder="e.g. Every Tuesday 3PM" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room / Venue</label>
                <input className="input" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Members (0 = unlimited)</label>
                <input className="input" type="number" min="0" value={form.max_members} onChange={e => setForm(f => ({ ...f, max_members: +e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
