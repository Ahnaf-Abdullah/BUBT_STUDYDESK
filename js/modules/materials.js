// Materials Module - Handles material approval and management

export const materials = {
  // Helper function for status badge classes
  statusClass(status) {
    if (!status) return "bg-gray-200 text-gray-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "denied") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  },

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

  // Initialize Approve Uploads fragment
  async initApproveUploads() {
    try {
      const container = document.getElementById("materialsContainer");
      const filter = document.getElementById("filterStatus");
      if (!container) return;

      const renderMaterials = async (statusFilter) => {
        try {
          container.innerHTML =
            '<div class="text-gray-500">Loading materials...</div>';

          const items = await window.API.getMaterials();
          const filtered =
            statusFilter && statusFilter !== "all"
              ? items.filter((i) => i.status === statusFilter)
              : items;

          container.innerHTML = "";
          if (filtered.length === 0) {
            container.innerHTML =
              '<div class="text-gray-400">No materials found.</div>';
            return;
          }

          filtered.forEach((m) => {
            const el = document.createElement("div");
            el.className =
              "p-3 bg-white/80 rounded-xl flex items-center justify-between";

            const uploaderName = m.uploader
              ? m.uploader.name || m.uploader
              : "Unknown";
            const courseName = m.course ? m.course.code : "Unknown Course";

            el.innerHTML = `
              <div>
                <div class="font-semibold">${this.escapeHtml(m.title)}</div>
                <div class="text-sm text-gray-600">${this.escapeHtml(
                  courseName
                )} — uploaded by ${this.escapeHtml(uploaderName)}</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="px-2 py-1 rounded-full text-sm font-medium ${this.statusClass(
                  m.status
                )}">${m.status}</div>
                ${
                  m.status === "pending"
                    ? `<button data-id="${
                        m._id || m.id
                      }" data-action="approve" class="approve-btn bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                <button data-id="${
                  m._id || m.id
                }" data-action="deny" class="deny-btn bg-red-600 text-white px-3 py-1 rounded-md text-sm">Deny</button>`
                    : ""
                }
              </div>
            `;
            container.appendChild(el);
          });

          // Attach approve/deny listeners
          Array.from(container.querySelectorAll(".approve-btn")).forEach(
            (b) => {
              b.addEventListener("click", async (e) => {
                const id = b.dataset.id;
                try {
                  await window.API.updateMaterialStatus(id, "approved");
                  renderMaterials(filter?.value || "all");
                } catch (error) {
                  console.error("Failed to approve material:", error);
                  alert("Failed to approve material: " + error.message);
                }
              });
            }
          );

          Array.from(container.querySelectorAll(".deny-btn")).forEach((b) => {
            b.addEventListener("click", async (e) => {
              const id = b.dataset.id;
              try {
                await window.API.updateMaterialStatus(id, "denied");
                renderMaterials(filter?.value || "all");
              } catch (error) {
                console.error("Failed to deny material:", error);
                alert("Failed to deny material: " + error.message);
              }
            });
          });
        } catch (error) {
          console.error("Failed to load materials:", error);
          container.innerHTML =
            '<div class="text-red-500">Failed to load materials. Please try again.</div>';
        }
      };

      // Wire filter
      if (filter) {
        filter.addEventListener("change", () => renderMaterials(filter.value));
      }
      // Initial render
      renderMaterials(filter?.value || "all");
    } catch (e) {
      console.error("initApproveUploads error", e);
    }
  },

  // Initialize My Uploads fragment
  async initMyUploads() {
    try {
      const container = document.getElementById("myUploadsList");
      if (!container) return;

      const getCurrentUser = () => {
        try {
          return JSON.parse(localStorage.getItem("currentUser") || "{}");
        } catch (e) {
          return null;
        }
      };

      const currentUser = getCurrentUser();
      const currentUserId = currentUser?._id || currentUser?.id;
      if (!currentUser || !currentUserId) {
        container.innerHTML =
          '<div class="text-gray-700">Please log in to view your uploads.</div>';
        return;
      }

      const render = async () => {
        try {
          container.innerHTML =
            '<div class="text-gray-500">Loading your uploads...</div>';

          const allMaterials = await window.API.getMaterials();

          const mine = allMaterials.filter((m) => {
            if (!m.uploader) return false;

            const materialUploaderId =
              m.uploader._id || m.uploader.id || m.uploader;

            return (
              materialUploaderId === currentUserId ||
              materialUploaderId === currentUser.email ||
              (typeof m.uploader === "object" &&
                m.uploader.email === currentUser.email)
            );
          });

          container.innerHTML = "";

          if (mine.length === 0) {
            container.innerHTML =
              '<div class="text-gray-700">You have not uploaded any materials yet. Upload your first material from the Dashboard!</div>';
            return;
          }

          mine.forEach((m) => {
            const row = document.createElement("div");
            row.className =
              "p-3 bg-white/80 rounded-xl flex items-center justify-between";

            const courseName = m.course ? m.course.code : "Unknown Course";

            row.innerHTML = `
              <div>
                <div class="font-semibold">${this.escapeHtml(m.title)}</div>
                <div class="text-sm text-gray-600">${this.escapeHtml(
                  courseName
                )} • ${this.escapeHtml(m.status)}</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="px-2 py-1 rounded-full text-sm font-medium ${this.statusClass(
                  m.status
                )}">${m.status}</div>
                <button class="viewBtn bg-teal-500 text-white px-3 py-1 rounded-md text-sm">View</button>
                <button aria-label="delete" class="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition">
                  Delete
                </button>
              </div>
            `;
            container.appendChild(row);

            // View button
            const viewBtn = row.querySelector(".viewBtn");
            if (viewBtn) {
              viewBtn.addEventListener("click", () => {
                if (m.fileId || m._id) {
                  const downloadUrl = `${window.API.baseURL}/materials/${m._id}/download`;
                  window.open(downloadUrl, "_blank");
                } else {
                  alert("No PDF available for this material.");
                }
              });
            }

            // Delete button
            const del = row.querySelector('button[aria-label="delete"]');
            if (del) {
              del.addEventListener("click", async () => {
                if (confirm("Are you sure you want to delete this material?")) {
                  try {
                    console.log("Deleting material:", m._id || m.id);
                    const result = await window.API.deleteMaterial(
                      m._id || m.id
                    );
                    console.log("Delete result:", result);
                    alert("Material deleted successfully!");
                    render();
                  } catch (error) {
                    console.error("Failed to delete material:", error);
                    alert("Failed to delete material: " + error.message);
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error("Failed to load uploads:", error);
          container.innerHTML =
            '<div class="text-red-500">Failed to load your uploads. Please try again.</div>';
        }
      };

      render();
    } catch (e) {
      console.error("initMyUploads error", e);
    }
  },
};
