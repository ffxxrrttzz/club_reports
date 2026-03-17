export interface User {
  id: number;
  email: string;
  fullName: string;
  clubId: number | null;
  role: string;
}

export async function getSession(): Promise<User | null> {
  try {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return null;
    }

    const decoded = JSON.parse(atob(token));

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
    // Remove token from localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");

    // Also try to call logout API
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }

    // Redirect to login
    window.location.href = "/login";
    return true;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
}
