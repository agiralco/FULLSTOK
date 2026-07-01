// Task Owner: Ariq Jamhari - Cuti
import { useEffect, useState } from 'react'
import axiosInstance from '../../utils/axiosInstance'
import { useAuth } from '../../context/AuthContext'


const emptyForm = {
  leave_type: 'Annual Leave',
  start_date: '',
  end_date: '',
  reason: '',
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Unpaid Leave']

function daysBetween(start, end) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  return Math.max(0, Math.round((e - s) / 86400000) + 1)
}

function formatDateRange(start, end) {
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—'
  return `${fmt(start)} – ${fmt(end)}`
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function LeaveRequests() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchLeave = async () => {
    setLoading(true)
    setError('')
  
    try {
      const res = await axiosInstance.get('/leave')
  
      console.log("API RESPONSE:", res.data)
  
      const leaveData =
        res.data?.data?.requests ??
        res.data?.data ??
        res.data ??
        []
  
      setRecords(Array.isArray(leaveData) ? leaveData : [])
    } catch (err) {
      setError('Failed to fetch leave requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeave()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const totalDays = daysBetween(form.start_date, form.end_date)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    console.log({
      user_id: user?.id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason
    });
    try {
      await axiosInstance.post('/leave', {
        user_id: user.id,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason
      })
      setModalOpen(false)
      setForm(emptyForm)
      showToast('Leave request submitted!')
      await fetchLeave()
    } catch (err) {
      console.log("ERROR:", err.response?.data);
    
      setError(
        err.response?.data?.message ||
        'Failed to submit leave request.'
      );
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`)
    try {
      await axiosInstance.post(`/leave/${id}/approve`)
      showToast('Leave approved!')
      await fetchLeave()
    } catch (err) {
      setError('Failed to approve leave.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(`reject-${id}`)
    try {
      await axiosInstance.post(`/leave/${id}/reject`)
      showToast('Leave rejected.')
      await fetchLeave()
    } catch (err) {
      setError('Failed to reject leave.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
          <p className="text-sm text-gray-500">
            {isAdmin ? 'Review and approve team leave requests.' : 'Submit and track your leave requests.'}
          </p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Request Leave
        </button>
      </div>

      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3.5 font-semibold">Name</th>
                <th className="px-6 py-3.5 font-semibold">Leave Type</th>
                <th className="px-6 py-3.5 font-semibold">Dates</th>
                <th className="px-6 py-3.5 font-semibold">Total Days</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold">Reason</th>
                {isAdmin && <th className="px-6 py-3.5 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                    <svg className="mx-auto h-6 w-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="mt-2">Loading leave requests...</p>
                  </td>
                </tr>
              ) : (!records || records.length === 0) ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                records?.map((r) => (
                  <tr key={r.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                          {r.user_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{r.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.leave_type}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDateRange(r.start_date, r.end_date)}</td>
                    <td className="px-6 py-4 text-gray-600">{r.total_days ?? daysBetween(r.start_date, r.end_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[r.status] || statusStyles.pending
                        }`}
                      >
                        {r.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-gray-600">
                      <span className="line-clamp-2">{r.reason || '—'}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(r.id)}
                                disabled={actionLoading === `approve-${r.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                              >
                                {actionLoading === `approve-${r.id}` ? (
                                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(r.id)}
                                disabled={actionLoading === `reject-${r.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                {actionLoading === `reject-${r.id}` ? (
                                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Leave Type</label>
            <select name="leave_type" value={form.leave_type} onChange={handleChange} className="input-field">
              {leaveTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Start Date</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">End Date</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="rounded-lg bg-primary-50 px-3.5 py-2.5 text-sm text-primary-700">
              Total: <span className="font-semibold">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              rows={3}
              className="input-field resize-none"
              placeholder="Briefly describe the reason for your leave..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
