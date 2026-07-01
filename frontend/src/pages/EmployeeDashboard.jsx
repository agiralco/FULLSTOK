// Task Owner: Team FULLSTOK - Employee & Manager Dashboard
import { useEffect, useState } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { useAuth } from '../context/AuthContext'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  // Check-in status state
  const [todayRecord, setTodayRecord] = useState(null)
  const [checking, setChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      // 1. Fetch user attendance history
      const attRes = await axiosInstance.get(`/attendance/user/${user.id}`)
      const attData = attRes.data?.data || []
      setAttendance(attData)

      // Find today's attendance record
      const todayRec = attData.find(r => r.date.split('T')[0] === todayStr || r.date === todayStr)
      setTodayRecord(todayRec || null)

      // 2. Fetch user leave requests
      const leaveRes = await axiosInstance.get(`/leave?user_id=${user.id}`)
      const leaveData = leaveRes.data?.data?.requests ?? leaveRes.data?.data ?? []
      setLeaves(leaveData)

      // 3. Fetch announcements
      const announceRes = await axiosInstance.get('/announcements')
      const announceData = announceRes.data?.data?.announcements ?? announceRes.data?.data ?? []
      setAnnouncements(announceData.slice(0, 3)) // Limit to top 3
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCheckIn = async () => {
    setChecking(true)
    setStatusMessage('')
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const timeStr = new Date().toTimeString().split(' ')[0] // HH:MM:SS
      
      await axiosInstance.post('/attendance/checkin', {
        user_id: user.id,
        date: todayStr,
        check_in: timeStr
      })
      
      setStatusMessage('Check-in successful!')
      await fetchData()
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Check-in failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleCheckOut = async () => {
    setChecking(true)
    setStatusMessage('')
    try {
      const timeStr = new Date().toTimeString().split(' ')[0] // HH:MM:SS
      
      await axiosInstance.post('/attendance/checkout', {
        user_id: user.id,
        check_out: timeStr
      })
      
      setStatusMessage('Check-out successful!')
      await fetchData()
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Check-out failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  // Calculate statistics from personal history
  const totalDays = attendance.length
  const presentDays = attendance.filter(r => r.status === 'present').length
  const lateDays = attendance.filter(r => r.status === 'late').length
  const pendingLeaves = leaves.filter(r => r.status === 'pending').length

  const formatTime = (timeStr) => {
    if (!timeStr) return '—'
    return timeStr.substring(0, 5) // Return HH:MM
  }

  return (
    <div className="space-y-6">
      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 p-6 text-white shadow-lg lg:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            {user?.role === 'manager' ? 'Manager Access' : 'Employee Portal'}
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight lg:text-3xl">
            Welcome back, {user?.name || 'User'}!
          </h2>
          <p className="mt-1.5 text-sm text-primary-100 max-w-xl">
            Here is your personal overview for today. Check your attendance status and company announcements below.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Present Days</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{presentDays}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 ring-1 ring-green-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-400">Out of {totalDays} total tracked days</span>
          </div>
        </div>

        <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Late Days</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{lateDays}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-400">Please arrive on time</span>
          </div>
        </div>

        <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Leaves</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{pendingLeaves}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-400">Awaiting HR approval</span>
          </div>
        </div>

        <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="mt-2 text-xl font-bold text-gray-900 capitalize">{user?.department || 'General'}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-400 font-medium capitalize">{user?.position || 'Employee'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Column 1 & 2: Attendance Check-in Widget & Personal Leave requests */}
        <div className="space-y-6 lg:col-span-2">
          {/* Interactive Check-in Card */}
          <div className="card p-6 border-l-4 border-l-primary-600">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Attendance Check-in</h3>
                <p className="text-xs text-gray-500 mt-0.5">Log your check-in and check-out times for today.</p>
                <div className="mt-4">
                  <p className="text-2xl font-mono font-bold tracking-tight text-gray-800">
                    {time.toLocaleTimeString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">
                    {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px] shrink-0">
                {statusMessage && (
                  <p className="text-xs font-semibold text-center py-1.5 px-3 rounded bg-gray-100 text-gray-700">
                    {statusMessage}
                  </p>
                )}

                {loading ? (
                  <p className="text-sm text-gray-400 text-center">Loading status...</p>
                ) : !todayRecord ? (
                  <button
                    type="button"
                    disabled={checking}
                    onClick={handleCheckIn}
                    className="btn-primary w-full py-2.5 justify-center shadow-sm"
                  >
                    {checking ? 'Checking in...' : 'Check In Now'}
                  </button>
                ) : !todayRecord.check_out ? (
                  <div className="space-y-2">
                    <p className="text-xs text-green-700 font-semibold text-center bg-green-50 py-1.5 rounded border border-green-200">
                      Checked in at {formatTime(todayRecord.check_in)}
                    </p>
                    <button
                      type="button"
                      disabled={checking}
                      onClick={handleCheckOut}
                      className="btn-primary w-full py-2.5 justify-center bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-sm"
                    >
                      {checking ? 'Checking out...' : 'Check Out Now'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 font-medium">Today's Shift Completed</p>
                    <p className="text-xs text-green-600 font-bold">
                      In: {formatTime(todayRecord.check_in)} | Out: {formatTime(todayRecord.check_out)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Leave Requests Summary */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">My Leave Requests</h3>
              <a href="/leave" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                View All
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2">Leave Type</th>
                    <th className="px-4 py-2">Period</th>
                    <th className="px-4 py-2">Days</th>
                    <th className="px-4 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400">
                        No leave requests submitted.
                      </td>
                    </tr>
                  ) : (
                    leaves.slice(0, 3).map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 capitalize">{r.leave_type}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(r.start_date).toLocaleDateString('id-ID')} - {new Date(r.end_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.total_days}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              r.status === 'approved'
                                ? 'bg-green-50 text-green-700'
                                : r.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column 3: Latest Announcements */}
        <div className="card p-6 h-fit">
          <h3 className="text-base font-bold text-gray-900 mb-4">Latest Announcements</h3>
          <ul className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No announcements posted.</p>
            ) : (
              announcements.map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                        a.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : a.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {a.priority}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(a.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
