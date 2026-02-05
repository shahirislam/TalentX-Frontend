import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LayoutDashboard, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Briefcase className="h-6 w-6 text-indigo-600" />
          TalentX
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Jobs
          </Link>
          {isAuthenticated && user?.role === 'employer' && (
            <Link to="/employer" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <LayoutDashboard className="h-4 w-4" />
              Employer Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'talent' && (
            <Link to="/talent" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <User className="h-4 w-4" />
              Talent Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/login?mode=register"
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
