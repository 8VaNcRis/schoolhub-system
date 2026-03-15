import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

const priorityConfig = {
  low:    { color: 'bg-gray-100 text-gray-600',    border: 'border-l-gray-300',    label: 'Low' },
  normal: { color: 'bg-blue-100 text-blue-700',    border: 'border-l-blue-400',    label: 'Normal' },
  high:   { color: 'bg-yellow-100 text-yellow-800', border: 'border-l-yellow-400', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800',       border: 'border-l-red-500',    label: 'Urgent' },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const empty = { title: '', content: '', priority: 'normal', target_role: 'all', expires_at: '' };

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const load = () => axios.get('/api/announcements').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(a => a.priority === filter);

  const save = async (e) => {
    e.preventDefault();
    await axios.post('/api/announcements', { ...form, expires_at: form.expires_at || null });
    setShowModal(false); setForm(empty); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await axios.delete(`/api/announcements/${id}`); load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} announcements</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={() => { setForm(empty); setShowModal(true); }}>+ New Announcement</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all','urgent','high','normal','low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-8 text-center text-gray-400">No announcements found.</div>
        )}
        {filtered.map(a => {
          const cfg = priorityConfig[a.priority];
          return (
            <div key={a.id} className={`card border-l-4 ${cfg.border} hover:shadow-md transition-shadow`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                      {a.target_role !== 'all' && (
                        <span className="badge bg-gray-100 text-gray-600">For {a.target_role}s</span>
                      )}
                      <span className="text-xs text-gray-400">{format(parseISO(a.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{a.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-3">Posted by {a.author_name}</p>
                    {a.expires_at && (
                      <p className="text-xs text-orange-500 mt-1">Expires: {format(parseISO(a.expires_at), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  {(canEdit) && (
                    <button onClick={() => del(a.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="New Announcement" onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea className="input" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select className="input" value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}>
                  {['all','student','teacher'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
              <input className="input" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Post Announcement</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
