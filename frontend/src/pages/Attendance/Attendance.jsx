// Task Owner: Ahmad Sulthon - Presensi
import { useEffect, useState } from 'react'
import axiosInstance from '../../utils/axiosInstance'


const statusStyles = {
  present: 'bg-green-50 text-green-700',
  late: 'bg-amber-50 text-amber-700',
  absent: 'bg-red-50 text-red-700',
  remote: 'bg-accent-50 text-accent-700',
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [lastCheckIn, setLastCheckIn] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAttendance = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosInstance.get('/attendance')
      // PERBAIKAN: Ubah menjadi res.data.data.attendance
      setRecords(res.data.data.attendance)
    } catch (err) {
      setError('Failed to fetch attendance records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  
  useEffect(() => {
    fetchAttendance()
  }, [])

  const handleCheckIn = async () => {
    setActionLoading('checkin')
    setError('')
  
    try {
      const user = JSON.parse(localStorage.getItem('user'))
  
      const res = await axiosInstance.post('/attendance/checkin', {
        user_id: user.id,
        date: new Date().toISOString().slice(0, 10),
        check_in: new Date().toTimeString().slice(0, 8),
        notes
      })
  
      setLastCheckIn(formatTime())
      showToast('Checked in successfully!')
      setNotes('')
      await fetchAttendance()
  
      return res
    } catch (err) {
      console.error(err.response?.data)
      setError(
        err.response?.data?.message ||
        'Failed to check in'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading('checkout')
    setError('')
  
    try {
      const user = JSON.parse(localStorage.getItem('user'))
  
      const res = await axiosInstance.post('/attendance/checkout', {
        user_id: user.id,
        check_out: new Date().toTimeString().slice(0, 8)
      })
  
      showToast('Checked out successfully!')
      await fetchAttendance()
  
      return res
    } catch (err) {
      console.log(err.response?.data)
  
      setError(
        err.response?.data?.message ||
        'Failed to check out'
      )
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
        <p className="text-sm text-gray-500">Track daily attendance and time records.</p>
      </div>

      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900">Today's Attendance</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Check In</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{lastCheckIn || '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Current Time</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">
                <ClockDisplay />
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-field resize-none"
              placeholder="Add a note for your attendance..."
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={actionLoading !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === 'checkin' ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
              Check In
            </button>
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={actionLoading !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === 'checkout' ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Check Out
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900">This Week</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Days Present</span>
              <span className="text-lg font-bold text-gray-900">4 / 5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">On Time</span>
              <span className="text-lg font-bold text-green-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Late</span>
              <span className="text-lg font-bold text-amber-600">1</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-green-500" style={{ width: '80%' }} />
            </div>
            <p className="text-xs text-gray-400">80% attendance rate</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3.5 font-semibold">Date</th>
                <th className="px-6 py-3.5 font-semibold">Check In</th>
                <th className="px-6 py-3.5 font-semibold">Check Out</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <svg className="mx-auto h-6 w-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="mt-2">Loading attendance...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records?.map((r) => (
                  <tr key={r.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.date}</td>
                    <td className="px-6 py-4 text-gray-600">{r.checkIn || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.checkOut || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[r.status] || statusStyles.present
                        }`}
                      >
                        {r.status || 'present'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ClockDisplay() {
  const [time, setTime] = useState(formatTime())
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(id)
  }, [])
  return <>{time}</>
}
