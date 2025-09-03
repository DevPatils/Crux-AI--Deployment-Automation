import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard";
import SignInPage from "./components/SignIn";
import SignUpPage from "./components/SignUp";
import { UserSync } from "./components/UserSync";
import Navbar from "./components/Navbar";   
import Resume from "./templets/temp1";

function App() {
  return (
    <Router>
      <Routes>
        {/* Portfolio Route - Public */}
        <Route path="/portfolio" element={<Resume />} />
        
        {/* Public routes */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

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

        {/* Root redirect */}
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <Navigate to="/portfolio" replace />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
