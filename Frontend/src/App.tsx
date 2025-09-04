import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard";
import SignInPage from "./components/SignIn";
import SignUpPage from "./components/SignUp";
import { UserSync } from "./components/UserSync";
import Navbar from "./components/Navbar";   
import Home from "./pages/Home";
import Templates from "./pages/Templetes";
import CreatePortfolio from "./pages/CreatePortfolio";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home Route - Public */}
        <Route path="/" element={<Home />} />
        
        {/* Portfolio Route - Public */}
        {/* <Route path="/portfolio" element={<Resume />} /> */}
        
        {/* Public routes */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Template routes */}
        <Route path="/templates" element={<Templates />} />
        <Route path="/create-portfolio" element={<CreatePortfolio />} />

        {/* Features, Templates, Contact routes */}
        <Route path="/features" element={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-800 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Features Coming Soon</h1><p className="text-gray-600">Exciting features in development</p></div></div>} />
        <Route path="/contact" element={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-800 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contact Coming Soon</h1><p className="text-gray-600">Get in touch with us soon</p></div></div>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <UserSync>
                <>
                  <Navbar/>
                  <Dashboard />
                </>
              </UserSync>
            </SignedIn>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
