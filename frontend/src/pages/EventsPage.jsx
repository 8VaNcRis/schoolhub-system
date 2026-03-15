import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

const typeColors = {
  academic: 'bg-blue-100 text-blue-800', cultural: 'bg-pink-100 text-pink-800',
  sports: 'bg-orange-100 text-orange-800', holiday: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800', other: 'bg-gray-100 text-gray-800',
};
const statusColors = {
  upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700',
};

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

const empty = { title: '', description: '', type: 'other', start_date: '', end_date: '', location: '', max_participants: 0, status: 'upcoming' };

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const load = () => axios.get('/api/events').then(r => setEvents(r.data));
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? events : filter === 'mine' ? events.filter(e => e.is_registered) : events.filter(e => e.status === filter || e.type === filter);

  const save = async (e) => {
    e.preventDefault();
    if (editing) await axios.put(`/api/events/${editing}`, form);
    else await axios.post('/api/events', form);
    setShowModal(false); setEditing(null); setForm(empty); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this event?')) return;
    await axios.delete(`/api/events/${id}`); load();
  };

  const toggleReg = async (ev) => {
    if (ev.is_registered) await axios.delete(`/api/events/${ev.id}/register`);
    else await axios.post(`/api/events/${ev.id}/register`);
    load();
  };

  const openEdit = (ev) => {
    setForm({ ...ev, start_date: ev.start_date.slice(0, 16), end_date: ev.end_date.slice(0, 16) });
    setEditing(ev.id); setShowModal(true);
  };

  const loadDetail = async (id) => {
    const r = await axios.get(`/api/events/${id}`);
    setViewEvent(r.data);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} events total</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setShowModal(true); }}>+ New Event</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', 'mine', 'upcoming', 'ongoing', 'completed', 'academic', 'cultural', 'sports'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(ev => (
          <div key={ev.id} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className={`badge ${typeColors[ev.type]}`}>{ev.type}</span>
                  <span className={`badge ${statusColors[ev.status]}`}>{ev.status}</span>
                </div>
                {ev.is_registered && <span className="badge bg-green-100 text-green-700">✓ Registered</span>}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{ev.title}</h3>
              {ev.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ev.description}</p>}
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {format(parseISO(ev.start_date), 'MMM d, yyyy h:mm a')}
                </div>
                {ev.location && <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {ev.location}
                </div>}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {ev.participant_count} registered {ev.max_participants > 0 && `/ ${ev.max_participants} max`}
                </div>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <button className="btn-secondary btn-sm flex-1" onClick={() => loadDetail(ev.id)}>Details</button>
              {ev.status === 'upcoming' && (
                <button onClick={() => toggleReg(ev)}
                  className={`btn-sm flex-1 rounded-lg font-medium transition-colors ${ev.is_registered ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'btn-primary'}`}>
                  {ev.is_registered ? 'Unregister' : 'Register'}
                </button>
              )}
              {canEdit && <button className="btn-secondary btn-sm" onClick={() => openEdit(ev)}>Edit</button>}
              {user?.role === 'admin' && <button className="btn-sm rounded-lg text-red-600 border border-red-200 hover:bg-red-50 px-3" onClick={() => del(ev.id)}>Del</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Event' : 'New Event'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {['academic','cultural','sports','holiday','meeting','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['upcoming','ongoing','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input className="input" type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input className="input" type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants (0 = unlimited)</label>
              <input className="input" type="number" min="0" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: +e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Save Event</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View detail modal */}
      {viewEvent && (
        <Modal title={viewEvent.title} onClose={() => setViewEvent(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`badge ${typeColors[viewEvent.type]}`}>{viewEvent.type}</span>
              <span className={`badge ${statusColors[viewEvent.status]}`}>{viewEvent.status}</span>
            </div>
            {viewEvent.description && <p className="text-sm text-gray-600">{viewEvent.description}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">Start</p><p className="font-medium">{format(parseISO(viewEvent.start_date), 'MMM d, yyyy h:mm a')}</p></div>
              <div><p className="text-gray-500 text-xs">End</p><p className="font-medium">{format(parseISO(viewEvent.end_date), 'MMM d, yyyy h:mm a')}</p></div>
              {viewEvent.location && <div><p className="text-gray-500 text-xs">Location</p><p className="font-medium">{viewEvent.location}</p></div>}
              <div><p className="text-gray-500 text-xs">Organizer</p><p className="font-medium">{viewEvent.organizer_name}</p></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Participants ({viewEvent.participant_count})</p>
              {viewEvent.participants?.length === 0 && <p className="text-sm text-gray-400">No participants yet</p>}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {viewEvent.participants?.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">{p.name.charAt(0)}</div>
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
