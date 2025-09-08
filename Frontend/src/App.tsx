import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import SignInPage from "./components/SignIn";
import SignUpPage from "./components/SignUp";
import { UserSync } from "./components/UserSync";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Templates from "./pages/Templetes";
import CreatePortfolio from "./pages/CreatePortfolio";
import { ToastProvider } from "./components/ToastProvider";
import { SignIn } from "@clerk/clerk-react";

function App() {
  return (
    <Router>
      <UserSync>
        <ToastProvider>
          {/* Global Navbar */}
          <Navbar />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Clerk SSO callback handler */}
            <Route
              path="/sso-callback/*"
              element={<SignIn routing="path" path="/sso-callback" afterSignInUrl="/dashboard" />}
            />

            <Route path="/templates" element={<Templates />} />
            <Route path="/create-portfolio" element={<CreatePortfolio />} />

            {/* Route remapping: keep old paths working */}
            <Route path="/features" element={<Home />} />
            <Route path="/contact" element={<Dashboard />} />

            {/* Protected */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </UserSync>
    </Router>
  );
}

export default App;
