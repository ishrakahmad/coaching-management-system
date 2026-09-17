import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import TeachersPage from './pages/teachers/TeachersPage';
import BatchesPage from './pages/batches/BatchesPage';
import GuardiansPage from './pages/guardians/GuardiansPage';
import ClassesPage from './pages/classes/ClassesPage';
import SessionsPage from './pages/sessions/SessionsPage';
import SubjectsPage from './pages/subjects/SubjectsPage';
import FeesPage from './pages/fees/FeesPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ReceiptPage from './pages/receipt/ReceiptPage';
import StaffPage from './pages/staff/StaffPage';

const queryClient = new QueryClient({
  defaultOptions: {
    // A 403/404 won't change on retry; only retry network-level failures once.
    queries: { retry: (count, error: any) => count < 1 && !error?.response, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="students/:id" element={<StudentDetailPage />} />
                  <Route path="guardians" element={<GuardiansPage />} />
                  <Route path="teachers" element={<TeachersPage />} />
                  <Route path="fees" element={<FeesPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/:id/receipt" element={<ReceiptPage />} />
                  <Route path="batches" element={<BatchesPage />} />
                  <Route path="classes" element={<ClassesPage />} />
                  <Route path="subjects" element={<SubjectsPage />} />
                  <Route path="sessions" element={<SessionsPage />} />
                  <Route path="staff" element={<StaffPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
