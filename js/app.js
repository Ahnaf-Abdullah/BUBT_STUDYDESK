// Import modules
import { auth } from "./modules/auth.js";
import { ui } from "./modules/ui.js";
import { fragments } from "./modules/fragments.js";
import { dashboard } from "./modules/dashboard.js";
import { materials } from "./modules/materials.js";
import { profile } from "./modules/profile.js";
import { userManagement } from "./modules/userManagement.js";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const showRegisterBtn = document.getElementById("showRegister");
  const quoteView = document.getElementById("quoteView");
  const registerView = document.getElementById("registerView");
  const uploadBtn = document.getElementById("uploadBtn");
  const profilePicInput = document.getElementById("profilePicInput");
  const preview = document.getElementById("preview");
  const cancelRegister = document.getElementById("cancelRegister");
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const loginPanel = document.getElementById("loginPanel");
  const basePanel = document.getElementById("Base");
  const dashboardEl = document.getElementById("dashboard");
  const currentUserEl = document.getElementById("currentUser");
  const bannerEl = document.getElementById("Banner");

  // Fragment cache and mapping
  const fragmentCache = new Map();
  const fragmentMapBase = {
    DASHBOARD: "fragments/dashboard.html",
    "MY UPLOADS": "fragments/myUploads.html",
    "MY PROFILE": "fragments/myProfile.html",
  };

  let fragmentMap = Object.assign({}, fragmentMapBase);
  let sidebarButtonLabels = ["DASHBOARD", "MY UPLOADS", "MY PROFILE"];

  // Section switcher - loads fragment HTML into dashboard
  async function showSection(label) {
    if (!dashboardEl) return;
    try {
      if (bannerEl && label) bannerEl.textContent = label;
    } catch (e) {
      /* ignore */
    }
    const path = fragmentMap[label];
    if (!path) return;

    // Use cache
    if (fragmentCache.has(path)) {
      dashboardEl.innerHTML = fragmentCache.get(path);
      runFragmentInit(path);
      return;
    }

    try {
      const html = await fragments.loadFragment(path);
      fragmentCache.set(path, html);
      dashboardEl.innerHTML = html;
      runFragmentInit(path);
    } catch (err) {
      dashboardEl.innerHTML = `<div class="text-red-400">Error loading section: ${err.message}</div>`;
      console.error(err);
    }
  }

  // Run per-fragment initialization
  function runFragmentInit(path) {
    if (!path) return;
    const p = path.replace(/\\\\/g, "/");

    if (p.endsWith("approveUploads.html")) {
      materials.initApproveUploads();
    }
    if (p.endsWith("userManagement.html")) {
      userManagement.init();
    }
    if (p.endsWith("dashboard.html")) {
      dashboard.init();
    }
    if (p.endsWith("myUploads.html")) {
      materials.initMyUploads();
    }
    if (p.endsWith("myProfile.html")) {
      profile.init();
    }
  }

  // Expose renderProfilePic globally for module access
  window.renderProfilePic = () => {
    ui.renderProfilePic();
  };

  // Toggle to registration view
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", () => {
      quoteView.classList.add("hidden");
      registerView.classList.remove("hidden");
      if (loginForm) loginForm.classList.add("hidden");
      const first =
        registerForm && registerForm.querySelector('input[name="name"]');
      if (first) first.focus();
    });
  }

  // Cancel registration -> back to quote/login
  if (cancelRegister) {
    cancelRegister.addEventListener("click", () => {
      registerView.classList.add("hidden");
      quoteView.classList.remove("hidden");
      if (loginForm) loginForm.classList.remove("hidden");
      if (registerForm) registerForm.reset();
      if (preview) {
        preview.src = "";
        preview.classList.add("hidden");
      }
    });
  }

  // Upload button triggers hidden file input
  if (uploadBtn && profilePicInput) {
    uploadBtn.addEventListener("click", () => profilePicInput.click());
    profilePicInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (preview) {
          preview.src = reader.result;
          preview.classList.remove("hidden");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Register handling using API
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(registerForm).entries());

      if (data.password !== data.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      const pic =
        preview && preview.src && preview.src !== window.location.href
          ? preview.src
          : "";

      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        department: data.department,
        studentId: data.studentId,
        gender: data.gender,
        section: parseInt(data.section) || 1,
        intake: data.intake,
        profilePicUrl: pic,
      };

      try {
        const response = await window.API.register(userData);
        auth.saveUser(response.user);

        alert("Registration successful! You are now logged in.");

        registerView.classList.add("hidden");
        quoteView.classList.remove("hidden");
        loginPanel.classList.add("hidden");
        basePanel.classList.remove("hidden");

        const role = response.user.role;
        const config = auth.getRoleConfig(role);
        sidebarButtonLabels = config.labels;
        fragmentMap = config.map;

        ui.renderSidebarButtons(sidebarButtonLabels, showSection, auth.logout);
        currentUserEl.textContent = response.user.name;
        ui.renderProfilePic();
        showSection("DASHBOARD");

        registerForm.reset();
        if (preview) {
          preview.src = "";
          preview.classList.add("hidden");
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert("Registration failed: " + error.message);
      }
    });
  }

  // Login handling
  if (loginForm) {
    const loginBtn =
      document.getElementById("loginBtn") || loginForm.querySelector("button");

    if (loginBtn) {
      loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
          const response = await window.API.login(email, password);
          auth.saveUser(response.user);

          const role = response.user.role;
          const config = auth.getRoleConfig(role);
          sidebarButtonLabels = config.labels;
          fragmentMap = config.map;

          loginPanel.classList.add("hidden");
          basePanel.classList.remove("hidden");

          ui.renderSidebarButtons(
            sidebarButtonLabels,
            showSection,
            auth.logout
          );
          currentUserEl.textContent = response.user.name;
          ui.renderProfilePic();
          showSection("DASHBOARD");
        } catch (error) {
          alert("Login failed: " + error.message);
        }
      });
    }
  }

  // Check if user is already logged in
  const token = localStorage.getItem("token");
  const currentUser = auth.getCurrentUser();

  if (token && currentUser && currentUser.id) {
    if (loginPanel) loginPanel.classList.add("hidden");
    if (basePanel) basePanel.classList.remove("hidden");

    const role = currentUser.role || "student";
    const cfg = auth.getRoleConfig(role);
    sidebarButtonLabels = cfg.labels;
    fragmentMap = cfg.map;

    ui.renderSidebarButtons(sidebarButtonLabels, showSection, auth.logout);

    if (currentUserEl) {
      currentUserEl.textContent =
        currentUser.name || currentUser.email || "User";
    }

    if (bannerEl) bannerEl.textContent = "DASHBOARD";

    try {
      ui.renderProfilePic();
    } catch (e) {
      /* ignore */
    }
  } else {
    if (loginPanel) loginPanel.classList.remove("hidden");
    if (basePanel) basePanel.classList.add("hidden");
  }

  // Forgot Password functionality
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const cancelForgotBtn = document.getElementById("cancelForgotBtn");
  const resetPasswordModal = document.getElementById("resetPasswordModal");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const cancelResetBtn = document.getElementById("cancelResetBtn");

  // Open forgot password modal
  if (forgotPasswordBtn && forgotPasswordModal) {
    forgotPasswordBtn.addEventListener("click", () => {
      forgotPasswordModal.classList.remove("hidden");
      document.getElementById("forgotEmail").focus();
    });
  }

  // Close forgot password modal
  if (cancelForgotBtn && forgotPasswordModal) {
    cancelForgotBtn.addEventListener("click", () => {
      forgotPasswordModal.classList.add("hidden");
      document.getElementById("forgotPasswordForm").reset();
      document.getElementById("forgotPasswordMessage").classList.add("hidden");
    });
  }

  // Handle forgot password form submission
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      const sendBtn = document.getElementById("sendResetBtn");
      const messageEl = document.getElementById("forgotPasswordMessage");

      if (!email) {
        alert("Please enter your email address");
        return;
      }

      try {
        sendBtn.textContent = "Sending...";
        sendBtn.disabled = true;

        await window.API.forgotPassword(email);

        messageEl.textContent =
          "Reset link sent to your email! Check your inbox.";
        messageEl.className = "text-sm text-green-600";
        messageEl.classList.remove("hidden");

        forgotPasswordForm.reset();

        setTimeout(() => {
          forgotPasswordModal.classList.add("hidden");
          messageEl.classList.add("hidden");
        }, 3000);
      } catch (error) {
        messageEl.textContent = "Failed to send reset link: " + error.message;
        messageEl.className = "text-sm text-red-600";
        messageEl.classList.remove("hidden");
      } finally {
        sendBtn.textContent = "Send Reset Link";
        sendBtn.disabled = false;
      }
    });
  }

  // Close reset password modal
  if (cancelResetBtn && resetPasswordModal) {
    cancelResetBtn.addEventListener("click", () => {
      resetPasswordModal.classList.add("hidden");
      document.getElementById("resetPasswordForm").reset();
      document.getElementById("resetPasswordMessage").classList.add("hidden");
    });
  }

  // Handle reset password form submission
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword =
        document.getElementById("confirmNewPassword").value;
      const resetBtn = document.getElementById("resetPasswordBtn");
      const messageEl = document.getElementById("resetPasswordMessage");

      if (newPassword !== confirmPassword) {
        messageEl.textContent = "Passwords do not match";
        messageEl.className = "text-sm text-red-600";
        messageEl.classList.remove("hidden");
        return;
      }

      if (newPassword.length < 6) {
        messageEl.textContent = "Password must be at least 6 characters";
        messageEl.className = "text-sm text-red-600";
        messageEl.classList.remove("hidden");
        return;
      }

      try {
        resetBtn.textContent = "Updating...";
        resetBtn.disabled = true;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
          throw new Error("Invalid reset token");
        }

        await window.API.resetPassword(token, newPassword);

        messageEl.textContent =
          "Password updated successfully! You can now login.";
        messageEl.className = "text-sm text-green-600";
        messageEl.classList.remove("hidden");

        setTimeout(() => {
          resetPasswordModal.classList.add("hidden");
          resetPasswordForm.reset();
          messageEl.classList.add("hidden");
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }, 2000);
      } catch (error) {
        messageEl.textContent = "Failed to reset password: " + error.message;
        messageEl.className = "text-sm text-red-600";
        messageEl.classList.remove("hidden");
      } finally {
        resetBtn.textContent = "Update Password";
        resetBtn.disabled = false;
      }
    });
  }

  // Check for reset token in URL on page load
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token");
  if (resetToken && resetPasswordModal) {
    window.API.verifyResetToken(resetToken)
      .then(() => {
        resetPasswordModal.classList.remove("hidden");
        document.getElementById("newPassword").focus();
      })
      .catch(() => {
        alert("Invalid or expired reset token");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      });
  }

  // Close modals when clicking outside
  if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener("click", (e) => {
      if (e.target === forgotPasswordModal) {
        forgotPasswordModal.classList.add("hidden");
      }
    });
  }

  if (resetPasswordModal) {
    resetPasswordModal.addEventListener("click", (e) => {
      if (e.target === resetPasswordModal) {
        resetPasswordModal.classList.add("hidden");
      }
    });
  }
});
