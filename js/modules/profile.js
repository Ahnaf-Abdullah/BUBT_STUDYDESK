// Profile Module - Handles user profile management

export const profile = {
  // Initialize My Profile fragment
  init() {
    try {
      const nameEl = document.getElementById("profileName");
      const studentIdEl = document.getElementById("profileStudentId");
      const deptEl = document.getElementById("profileDept");
      const intakeEl = document.getElementById("profileIntake");
      const actionsEl = document.getElementById("profileActions");

      const getCurrentUser = () => {
        try {
          return JSON.parse(localStorage.getItem("currentUser") || "{}");
        } catch (e) {
          return null;
        }
      };

      const user = getCurrentUser();
      if (!nameEl || !actionsEl) return;

      const renderView = () => {
        if (!user || !user.id) {
          nameEl.textContent = "Guest";
          if (studentIdEl) studentIdEl.textContent = "-";
          if (deptEl) deptEl.textContent = "-";
          if (intakeEl) intakeEl.textContent = "-";
          actionsEl.innerHTML =
            '<div class="text-sm text-gray-400">Log in to edit your profile.</div>';
          return;
        }

        // Display user information
        nameEl.textContent = user.name || user.email || "User";
        if (studentIdEl) studentIdEl.textContent = user.studentId || "-";
        if (intakeEl) intakeEl.textContent = user.intake || "-";
        if (deptEl) deptEl.textContent = user.department || "-";

        // Additional fields if they exist in the DOM
        const emailEl = document.getElementById("profileEmail");
        const genderEl = document.getElementById("profileGender");
        const sectionEl = document.getElementById("profileSection");

        if (emailEl) emailEl.textContent = user.email || "-";
        if (genderEl) genderEl.textContent = user.gender || "-";
        if (sectionEl) sectionEl.textContent = user.section || "-";

        // Render persistent picture controls and edit button
        actionsEl.innerHTML = `
          <div id="profilePicEditPersistent" class="flex items-center gap-4 mb-3">
            <input id="profilePicInputPersistent" type="file" accept="image/*" class="hidden" />
            <button id="changePicBtnPersistent" class="bg-white text-black px-4 py-2 rounded-md">Change Picture</button>
            <img id="profilePreviewPersistent" src="" alt="preview" class="w-16 h-16 object-cover rounded-md ${
              user && user.profilePicUrl ? "" : "hidden"
            }" />
          </div>
          <div>
            <button id="editBtn" class="bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-90">Edit Profile</button>
          </div>
        `;

        const editBtn = document.getElementById("editBtn");
        if (editBtn) editBtn.addEventListener("click", () => showEdit());

        // Wire persistent picture controls
        try {
          const changeBtn = document.getElementById("changePicBtnPersistent");
          const picInput = document.getElementById("profilePicInputPersistent");
          const picPreview = document.getElementById(
            "profilePreviewPersistent"
          );
          if (changeBtn && picInput) {
            changeBtn.addEventListener("click", () => picInput.click());
          }
          if (picInput) {
            picInput.addEventListener("change", async (ev) => {
              const f = ev.target.files && ev.target.files[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = async () => {
                try {
                  const data = r.result;
                  if (picPreview) {
                    picPreview.src = data;
                    picPreview.classList.remove("hidden");
                  }
                  // Update on server via API and then localStorage
                  try {
                    const updatedUser = await window.API.updateUserProfile(
                      user.id,
                      { profilePicUrl: data }
                    );

                    // Update localStorage with the server response
                    const currentUserData = {
                      ...user,
                      profilePicUrl: updatedUser.profilePicUrl,
                    };
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify(currentUserData)
                    );

                    console.log("Profile picture updated successfully!");
                    // Call external renderProfilePic if available
                    if (
                      window.renderProfilePic &&
                      typeof window.renderProfilePic === "function"
                    ) {
                      window.renderProfilePic();
                    }
                  } catch (apiError) {
                    console.error(
                      "Failed to update profile picture on server:",
                      apiError
                    );
                    // Fallback to localStorage only if server update fails
                    const updatedUser = { ...user, profilePicUrl: data };
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify(updatedUser)
                    );
                    if (
                      window.renderProfilePic &&
                      typeof window.renderProfilePic === "function"
                    ) {
                      window.renderProfilePic();
                    }
                  }
                } catch (err) {
                  console.warn("profile pic save failed", err);
                }
              };
              r.readAsDataURL(f);
            });
          }
        } catch (err) {
          /* ignore */
        }
      };

      const showEdit = () => {
        // Create and open modal
        try {
          // Create modal HTML
          const modalHTML = `
            <div id="editProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 class="text-xl font-bold mb-4">Edit Profile</h2>
                <form id="editProfileForm" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <input name="name" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Department</label>
                    <input name="department" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Section</label>
                    <input name="section" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Intake</label>
                    <input name="intake" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2">
                  </div>
                  <div class="flex gap-3 pt-4">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1">Save Changes</button>
                    <button type="button" id="cancelEditProfile" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 flex-1">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          `;

          // Remove existing modal if any
          const existingModal = document.getElementById("editProfileModal");
          if (existingModal) existingModal.remove();

          // Add modal to body
          document.body.insertAdjacentHTML("beforeend", modalHTML);

          const modal = document.getElementById("editProfileModal");
          const form = document.getElementById("editProfileForm");

          if (!modal || !form) return;

          // Populate form fields
          form.elements["name"].value = user.name || "";
          form.elements["department"].value = user.department || "";
          form.elements["section"].value =
            user.section != null ? String(user.section) : "";
          form.elements["intake"].value = user.intake || "";

          // Handle cancel button
          const cancelBtn = document.getElementById("cancelEditProfile");
          if (cancelBtn) {
            cancelBtn.onclick = () => {
              modal.remove();
            };
          }

          // Handle form submission
          form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            try {
              submitBtn.textContent = "Saving...";
              submitBtn.disabled = true;

              const fd = new FormData(form);
              const updatedData = {
                name: (fd.get("name") || "").trim(),
                department: (fd.get("department") || "").trim(),
                section: (fd.get("section") || "").trim(),
                intake: (fd.get("intake") || "").trim(),
              };

              // Update profile via API
              const updatedUser = await window.API.updateUserProfile(
                user.id,
                updatedData
              );

              // Update localStorage with server response
              localStorage.setItem("currentUser", JSON.stringify(updatedUser));

              // Re-render profile view
              renderView();
              if (
                window.renderProfilePic &&
                typeof window.renderProfilePic === "function"
              ) {
                window.renderProfilePic();
              }

              // Close modal
              modal.remove();

              console.log("Profile updated successfully!");
            } catch (err) {
              console.error("Profile update failed:", err);
              alert("Failed to update profile. Please try again.");
            } finally {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          };

          // Close modal when clicking outside
          modal.onclick = (e) => {
            if (e.target === modal) {
              modal.remove();
            }
          };
        } catch (err) {
          console.error("Failed to open edit modal:", err);
        }
      };

      renderView();
    } catch (e) {
      console.error("initMyProfile error", e);
    }
  },
};
