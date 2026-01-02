import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Home, Users, FolderKanban } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/dashboard" className="flex items-center">
              <FolderKanban className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">WorkPlanner</span>
            </Link>
            
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/teams"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                <Users className="h-4 w-4 mr-2" />
                Teams
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};