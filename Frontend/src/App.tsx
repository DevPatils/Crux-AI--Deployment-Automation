import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard";
import SignInPage from "./components/SignIn";
import SignUpPage from "./components/SignUp";
import { UserSync } from "./components/UserSync";
import Navbar from "./components/Navbar";   

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
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
                       {/* Navbar visible only when signed in */}
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
                <Navigate to="/signin" replace />
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
