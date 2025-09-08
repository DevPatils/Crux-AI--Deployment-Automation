import React from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const { isSignedIn } = useUser();

  return (
    <nav className="w-full bg-white border-b border-gray-200 text-gray-800 px-6 py-4 shadow-sm flex items-center justify-between">
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide text-blue-600 hover:text-blue-700 transition-colors duration-300">
          CRUX AI
        </Link>
      </div>

      {/* Center - Navigation Links */}
      <div className="flex items-center space-x-8">
        <Link 
          to="/" 
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
        >
          Home
        </Link>
        <Link 
          to="/templates" 
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
        >
          Templates
        </Link>
        <Link 
          to="/dashboard" 
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
        >
          Dashboard
        </Link>
      </div>

      {/* Right - Authentication & Dashboard */}
      <div className="flex items-center space-x-4">
        {isSignedIn ? (
          <>

            <UserButton afterSignOutUrl="/signin" />
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <Link 
              to="/signin" 
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
