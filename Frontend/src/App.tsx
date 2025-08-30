import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard";
import SignInPage from "./components/SignIn";
import SignUpPage from "./components/SignUp";
import { UserSync } from "./components/UserSync";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <UserSync>
                <Dashboard />
              </UserSync>
            </SignedIn>
          }
        />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
