// Auth Module - Handles login, registration, and password reset

export const auth = {
  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem("currentUser");
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("Error getting current user:", e);
      return null;
    }
  },

  // Save user to localStorage
  saveUser(user) {
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (e) {
      console.error("Error saving user:", e);
    }
  },

  // Clear user data and logout
  logout() {
    try {
      window.API.logout();
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
    } catch (e) {
      console.error("Logout error:", e);
    }
  },

  // Get role configuration
  getRoleConfig(role) {
    role = (role || "").toLowerCase();
    const base = ["DASHBOARD", "MY UPLOADS", "MY PROFILE"];
    const fragmentMapBase = {
      DASHBOARD: "fragments/dashboard.html",
      "MY UPLOADS": "fragments/myUploads.html",
      "MY PROFILE": "fragments/myProfile.html",
    };

    if (role === "moderator") {
      return {
        labels: [...base, "APPROVE UPLOADS"],
        map: {
          ...fragmentMapBase,
          "APPROVE UPLOADS": "fragments/approveUploads.html",
        },
      };
    }
    if (role === "admin") {
      return {
        labels: [...base, "APPROVE UPLOADS", "USER MANAGEMENT"],
        map: {
          ...fragmentMapBase,
          "APPROVE UPLOADS": "fragments/approveUploads.html",
          "USER MANAGEMENT": "fragments/userManagement.html",
        },
      };
    }
    return { labels: base, map: fragmentMapBase };
  },
};
