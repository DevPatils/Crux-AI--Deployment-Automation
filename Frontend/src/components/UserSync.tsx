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
          const response = await api.post(
            "/users/sync",   // ✅ FIXED ENDPOINT
            {
              email: user.emailAddresses[0]?.emailAddress,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200) {
            console.log("✅ User synced to DB:", response.data);
          } else {
            console.error("❌ Failed to sync user to database");
          }
        } catch (error) {
          console.error("❌ Error syncing user:", error);
        }
      }
    };

    syncUser();
  }, [user, isLoaded, getToken]);

  return <>{children}</>;
};
