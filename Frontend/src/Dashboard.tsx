import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

interface Project {
  id: number;
  title: string;
  prompt: string;
  contentJSON: Record<string, unknown>;
  deployedUrl?: string;
  userId: number;
  createdAt: string;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      const token = await getToken();
      const res = await fetch("http://localhost:5000/users/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.emailAddresses[0].emailAddress }),
      });

      const dbUser = await res.json();
      console.log("User synced to DB:", dbUser);
    };

    syncUser();
  }, [user, getToken]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      console.log(token);
      const res = await fetch("http://localhost:5000/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      } else {
        console.error("Error fetching projects");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Welcome, {user?.firstName || "User"}!</h1>
        <UserButton />
      </div>
      
      <button onClick={fetchProjects} disabled={loading}>
        {loading ? "Loading..." : "Fetch My Projects"}
      </button>
      
      {projects.length > 0 ? (
        <ul style={{ marginTop: "20px" }}>
          {projects.map((p) => (
            <li key={p.id} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
              <strong>{p.title}</strong> — {p.prompt}
              {p.deployedUrl && (
                <div>
                  <a href={p.deployedUrl} target="_blank" rel="noopener noreferrer">
                    View Deployed Project
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: "20px" }}>No projects found. Create your first project!</p>
      )}
    </div>
  );
}
