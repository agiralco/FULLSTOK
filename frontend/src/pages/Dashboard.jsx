// Task Owner: Team FULLSTOK - Dashboard
import { useEffect, useState } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { useAuth } from '../context/AuthContext'

const stats = [
  {
    label: 'Total Employees',
    value: '248',
    change: '+12%',
    trend: 'up',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.66M5 12a3 3 0 102-5.66" />
      </svg>
    ),
    accent: 'primary',
  },
  {
    label: 'Present Today',
    value: '226',
    change: '91%',
    trend: 'up',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: 'green',
  },
  {
    label: 'On Leave',
    value: '14',
    change: '-3%',
    trend: 'down',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    accent: 'amber',
  },
  {
    label: 'Open Announcements',
    value: '5',
    change: '+2',
    trend: 'up',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.118a1 1 0 01-1.243.97l-4.5-1.5A1 1 0 014.5 17.5V7.5a1 1 0 01.757-.97l4.5-1.5A1 1 0 0111 5.882zM15 6v12m3-9v6" />
      </svg>
    ),
    accent: 'accent',
  },
]

const accentMap = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-600', ring: 'ring-accent-100' },
}

const recentActivity = [
  { user: 'Gilang Ramadan', action: 'checked in', time: '2 min ago', type: 'checkin' },
  { user: 'Muhtari Anwar', action: 'updated profile', time: '15 min ago', type: 'update' },
  { user: 'Ahmad Sulthon', action: 'requested leave', time: '1 hour ago', type: 'leave' },
  { user: 'System', action: 'posted an announcement', time: '3 hours ago', type: 'announce' },
]

const activityIcon = {
  checkin: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  update: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  leave: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  announce: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.118a1 1 0 01-1.243.97l-4.5-1.5A1 1 0 014.5 17.5V7.5a1 1 0 01.757-.97l4.5-1.5A1 1 0 0111 5.882zM15 6v12m3-9v6" />
    </svg>
  ),
}

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchSummary() {
      try {
        const res = await axiosInstance.get('/attendance/summary')
        if (!cancelled && res.data) setSummary(res.data)
      } catch (err) {
        console.error('Dashboard summary fetch failed:', err)
      }
    }
    fetchSummary()
    return () => {
      cancelled = true
    }
  }, [])

  const displayStats = summary
    ? [
        { ...stats[0], value: String(summary.totalEmployees ?? stats[0].value) },
        { ...stats[1], value: String(summary.presentToday ?? stats[1].value) },
        { ...stats[2], value: String(summary.onLeave ?? stats[2].value) },
        { ...stats[3], value: String(summary.announcements ?? stats[3].value) },
      ]
    : stats

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Overview of your organization's HR metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((s) => {
          const a = accentMap[s.accent]
          return (
            <div
              key={s.label}
              className="card group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{s.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring} transition-transform duration-300 group-hover:scale-110`}>
                  {s.icon}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                    s.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {s.trend === 'up' ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  )}
                  {s.change}
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
            <button type="button" className="text-sm font-medium text-primary-600 transition hover:text-primary-700">
              View all
            </button>
          </div>
          <ul className="space-y-1">
            {recentActivity.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  {activityIcon[item.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-900">
                    <span className="font-medium">{item.user}</span>{' '}
                    <span className="text-gray-500">{item.action}</span>
                  </p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-gray-500">Common tasks at your fingertips.</p>
          <div className="mt-4 space-y-2.5">
            {isAdmin && (
              <a href="/directory" className="flex items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Employee
              </a>
            )}
            <a href="/attendance" className="flex items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check In Now
            </a>
            {isAdmin && (
              <a href="/announcements" className="flex items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Post Announcement
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
