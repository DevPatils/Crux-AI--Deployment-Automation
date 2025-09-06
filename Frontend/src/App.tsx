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
      <UserSync>
        {/* Global Navbar */}
        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/create-portfolio" element={<CreatePortfolio />} />

          {/* Placeholder pages */}
          <Route path="/features" element={<div>Features Coming Soon</div>} />
          <Route path="/contact" element={<div>Contact Coming Soon</div>} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserSync>
    </Router>
  );
}

export default App;
