import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import api from "../services/api";

export const UserSync = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && user) {
        try {
          const token = await getToken();
          const response = await api.post("/users/signup", 
            {
              email: user.emailAddresses[0]?.emailAddress,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status !== 200) {
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
