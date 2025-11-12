// User Management Module - Handles admin user management

export const userManagement = {
  // Escape HTML helper
  escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Initialize User Management fragment
  init() {
    try {
      const container = document.getElementById("usersContainer");
      const addForm = document.getElementById("addUserForm");
      if (!container) return;

      const renderUsers = async () => {
        container.innerHTML = "";
        let users = [];
        try {
          users = await window.API.getUsers();
        } catch (error) {
          console.error("Failed to fetch users:", error);
          container.innerHTML =
            '<div class="text-black">Error loading users</div>';
          return;
        }
        if (users.length === 0) {
          container.innerHTML = '<div class="text-black">No users</div>';
          return;
        }
        users.forEach((u) => {
          const row = document.createElement("div");
          row.className =
            "flex items-center justify-between bg-white/10 p-3 rounded-md";
          row.innerHTML = `
            <div>
              <div class="font-semibold">${this.escapeHtml(u.name)}</div>
              <div class="text-sm text-black">${this.escapeHtml(u.email)}</div>
            </div>
            <div class="flex items-center gap-2">
              <select class="roleSelect text-black px-2 py-1 rounded-md">
                <option value="student">student</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              <button class="saveRoleBtn bg-gradient-to-r from-teal-500 to-indigo-600 text-black px-3 py-1 rounded-md">Save</button>
            </div>
          `;
          container.appendChild(row);
          const select = row.querySelector(".roleSelect");
          select.value = u.role || "student";
          const saveBtn = row.querySelector(".saveRoleBtn");
          saveBtn.addEventListener("click", async () => {
            try {
              await window.API.updateUserRole(u._id || u.id, select.value);
              renderUsers();
              alert(`Role updated for ${u.name}: ${select.value}`);
            } catch (error) {
              console.error("Failed to update user role:", error);
              alert("Failed to update role: " + error.message);
            }
          });
        });
      };

      if (addForm) {
        addForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(addForm);
          const name = (fd.get("name") || "").trim();
          const email = (fd.get("email") || "").trim().toLowerCase();
          const studentId = (fd.get("studentId") || "").trim();
          if (!name || !email) return alert("Provide name and email");

          try {
            // Create user with default password
            await window.API.register({
              name,
              email,
              password: "defaultpass123",
              studentId: studentId || `STU${Date.now()}`,
              department: "General",
              gender: "Other",
              section: "A",
              intake: new Date().getFullYear().toString(),
            });
            addForm.reset();
            renderUsers();
            alert("User added successfully! Default password: defaultpass123");
          } catch (error) {
            console.error("Failed to add user:", error);
            alert("Failed to add user: " + error.message);
          }
        });
      }

      renderUsers();
    } catch (e) {
      console.error("initUserManagement error", e);
    }
  },
};
