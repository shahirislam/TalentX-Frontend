import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import JobListing from './pages/JobListing.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Login from './pages/Login.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import TalentDashboard from './pages/TalentDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<JobListing />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="login" element={<Login />} />
        <Route
          path="employer"
          element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="talent"
          element={
            <ProtectedRoute role="talent">
              <TalentDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
