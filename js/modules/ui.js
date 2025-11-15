// UI Module - Handles UI rendering and interactions

export const ui = {
  // Render sidebar buttons
  renderSidebarButtons(labels, onSectionClick, onLogout) {
    const sidebar = document.getElementById("Sidebar");
    if (!sidebar) return;

    // Remove previously generated buttons
    Array.from(sidebar.querySelectorAll('[data-generated="true"]')).forEach(
      (n) => n.remove()
    );

    // Create new buttons
    labels.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.generated = "true";
      btn.textContent = label;
      btn.className =
        "block bg-white text-black w-full py-3 rounded-2xl font-semibold hover:bg-gray-200 text-center mb-3";
      btn.addEventListener("click", () => onSectionClick(label));
      sidebar.appendChild(btn);
    });

    // Logout button
    const logout = document.createElement("button");
    logout.type = "button";
    logout.dataset.generated = "true";
    logout.textContent = "LOGOUT";
    logout.className =
      "block bg-red-600 text-white w-full py-3 rounded-2xl font-semibold hover:bg-red-700 text-center mt-2";
    logout.addEventListener("click", () => {
      onLogout();
      // Show login panel again
      const loginPanel = document.getElementById("loginPanel");
      const basePanel = document.getElementById("Base");
      if (loginPanel && basePanel) {
        basePanel.classList.add("hidden");
        loginPanel.classList.remove("hidden");
      }
    });
    sidebar.appendChild(logout);
  },

  // Render profile picture
  renderProfilePic() {
    try {
      const user = this.getCurrentUser();
      const img = document.getElementById("profilePicImg");
      const fallback = document.getElementById("profilePicFallback");

      console.log("renderProfilePic called:");
      console.log("- Current user:", user);
      console.log("- Profile pic URL:", user?.profilePicUrl);

      if (!img || !fallback) {
        console.warn("Missing profile pic elements");
        return;
      }

      if (user && user.profilePicUrl) {
        console.log("Setting profile image:", user.profilePicUrl);
        img.src = user.profilePicUrl;
        img.classList.remove("hidden");
        fallback.classList.add("hidden");
      } else {
        console.log("Showing fallback profile pic");
        img.src = "";
        img.classList.add("hidden");
        fallback.classList.remove("hidden");
      }
    } catch (e) {
      console.warn("renderProfilePic error", e);
    }
  },

  // Helper to get current user
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "{}");
    } catch (e) {
      return null;
    }
  },

  // Update banner with user info
  updateBanner(user) {
    const bannerEl = document.getElementById("Banner");
    if (!bannerEl) return;

    if (user && user.name) {
      bannerEl.innerHTML = `
        <div class="welcome-banner">
          <p class="text-2xl font-bold">WELCOME</p>
          <p class="text-4xl font-extrabold">${user.name}</p>
        </div>
      `;
    }
  },

  // Show loading state
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = '<div class="text-center p-8">Loading...</div>';
    }
  },

  // Show error message
  showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = `<div class="text-center p-8 text-red-500">${message}</div>`;
    }
  },

  // Clear profile picture
  clearProfilePic() {
    const profilePicImg = document.getElementById("profilePicImg");
    const profilePicFallback = document.getElementById("profilePicFallback");
    if (profilePicImg) {
      profilePicImg.src = "";
      profilePicImg.classList.add("hidden");
    }
    if (profilePicFallback) {
      profilePicFallback.classList.remove("hidden");
    }
  },
};
