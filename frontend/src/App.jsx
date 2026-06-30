// Task Owner: Gilang Ramadan - Auth FE
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeeList from './pages/Employees/EmployeeList'
import Attendance from './pages/Attendance/Attendance'
import LeaveRequests from './pages/Leave/LeaveRequests'
import Announcements from './pages/Announcements/Announcements'
import NotFound from './pages/NotFound'
import Register from './pages/Register';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<EmployeeList />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<LeaveRequests />} />
            <Route path="/announcements" element={<Announcements />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
