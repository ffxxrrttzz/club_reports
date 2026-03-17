export interface User {
  id: number;
  email: string;
  fullName: string;
  clubId: number | null;
  role: string;
}

export async function getSession(): Promise<User | null> {
  try {
    // Try to decode session from cookie on client side
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((c) => c.trim().startsWith("session="));

    if (!sessionCookie) {
      return null;
    }

    const sessionData = sessionCookie.split("=")[1];
    const decoded = JSON.parse(atob(decodeURIComponent(sessionData)));

    return {
      id: decoded.userId,
      email: decoded.email,
      fullName: decoded.email, // Email as fallback
      clubId: null,
      role: decoded.role,
    };
  } catch (err) {
    console.error("Error decoding session:", err);
    return null;
  }
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (res.ok) {
      // Redirect to login
      window.location.href = "/login";
      return true;
    }

    return false;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
}
