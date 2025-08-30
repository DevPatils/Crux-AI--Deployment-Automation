import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";

export const UserSync = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && user) {
        try {
          const token = await getToken();
          const response = await fetch("http://localhost:5000/users/signup", {
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
