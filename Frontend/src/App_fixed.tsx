import { SignIn, SignUp, SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-react";
import Dashboard from "./Dashboard";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Component to sync user to database after sign-in
const UserSync = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && user) {
        try {
          const token = await getToken();
          const response = await fetch("http://localhost:5000/users/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: user.emailAddresses[0]?.emailAddress,
            }),
          });
          
          if (!response.ok) {
            console.error("Failed to sync user to database");
          } else {
            console.log("User synced to database successfully");
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };

    syncUser();
  }, [user, isLoaded, getToken]);

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/signin" 
          element={
            <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
              <SignIn 
                signUpUrl="/signup"
                afterSignInUrl="/dashboard"
              />
            </div>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
              <SignUp 
                signInUrl="/signin"
                afterSignUpUrl="/dashboard"
              />
            </div>
          } 
        />
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
