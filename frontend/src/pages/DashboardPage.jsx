import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

const eventTypeColors = {
  academic: 'bg-blue-100 text-blue-800',
  cultural: 'bg-pink-100 text-pink-800',
  sports: 'bg-orange-100 text-orange-800',
  holiday: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/api/dashboard/stats').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="flex items-center justify-center h-screen"><div className="text-gray-400">Loading dashboard...</div></div>;

  const { stats, upcoming_events, recent_announcements } = data;

  const statCards = [
    { label: 'Total Students', value: stats.total_students, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Teachers', value: stats.total_teachers, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Upcoming Events', value: stats.upcoming_events, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Activities', value: stats.active_activities, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'My Events', value: stats.my_events, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'My Activities', value: stats.my_activities, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening at school today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
            <a href="/events" className="text-sm text-blue-600 hover:text-blue-800">View all</a>
          </div>
          <div className="space-y-3">
            {upcoming_events.length === 0 && <p className="text-sm text-gray-400">No upcoming events</p>}
            {upcoming_events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3">
                <div className="min-w-[48px] text-center bg-blue-50 rounded-lg py-1">
                  <p className="text-xs text-blue-500 font-medium">{format(parseISO(ev.start_date), 'MMM')}</p>
                  <p className="text-lg font-bold text-blue-700 leading-none">{format(parseISO(ev.start_date), 'd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{ev.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`badge ${eventTypeColors[ev.type]}`}>{ev.type}</span>
                    {ev.location && <span className="text-xs text-gray-400 truncate">{ev.location}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Announcements</h2>
            <a href="/announcements" className="text-sm text-blue-600 hover:text-blue-800">View all</a>
          </div>
          <div className="space-y-3">
            {recent_announcements.length === 0 && <p className="text-sm text-gray-400">No announcements</p>}
            {recent_announcements.map(a => (
              <div key={a.id} className="border-l-2 border-blue-200 pl-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`badge text-xs ${priorityColors[a.priority]}`}>{a.priority}</span>
                  <span className="text-xs text-gray-400">{format(parseISO(a.created_at), 'MMM d')}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.author_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
