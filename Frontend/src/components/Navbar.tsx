import React from "react";
import { UserButton } from "@clerk/clerk-react";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-3 shadow-md flex items-center justify-between">
      {/* Left spacer (to help center title) */}
      <div className="w-24"></div>

      {/* Center Title */}
      <div className="flex-1 text-center">
        <h1 className="text-xl font-bold tracking-wide">CRUX AI</h1>
      </div>

      {/* Right User Button */}
      <div className="w-24 flex justify-end">
        <UserButton afterSignOutUrl="/signin" />
      </div>
    </nav>
  );
};

export default Navbar;
