// Dashboard Module - Handles dashboard initialization and rendering

export const dashboard = {
  // Initialize Dashboard fragment: show departments, courses, and materials
  async init() {
    try {
      const container = document.getElementById("departmentsContainer");
      const totalUsersEl = document.getElementById("totalUsersCount");
      const totalUploadsEl = document.getElementById("totalUploadsCount");
      const totalCoursesEl = document.getElementById("totalCoursesCount");
      if (!container) return;

      // Helper functions
      const getCurrentUserRole = () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem("currentUser") || "{}"
          );
          return currentUser.role || "student";
        } catch (e) {
          return "student";
        }
      };

      const getCurrentUser = () => {
        try {
          return JSON.parse(localStorage.getItem("currentUser") || "{}");
        } catch (e) {
          return null;
        }
      };

      const escapeHtml = (str) => {
        if (str == null) return "";
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      // Populate top stats from API
      try {
        const userRole = getCurrentUserRole();
        let users = [];
        if (userRole === "admin") {
          users = await window.API.getUsers().catch(() => []);
        }

        const [materials, courses] = await Promise.all([
          window.API.getMaterials().catch(() => []),
          window.API.getCourses().catch(() => []),
        ]);

        if (totalUsersEl) {
          totalUsersEl.textContent =
            userRole === "admin" ? String(users.length || 0) : "-";
        }
        if (totalUploadsEl)
          totalUploadsEl.textContent = String(materials.length || 0);
        if (totalCoursesEl)
          totalCoursesEl.textContent = String(courses.length || 0);
      } catch (e) {
        console.warn("Failed to load dashboard stats:", e);
        if (totalUsersEl) totalUsersEl.textContent = "0";
        if (totalUploadsEl) totalUploadsEl.textContent = "0";
        if (totalCoursesEl) totalCoursesEl.textContent = "0";
      }

      // Render departments grid
      const renderDepartments = async () => {
        container.innerHTML = "";
        let deps = [];
        try {
          deps = await window.API.getDepartments();
        } catch (e) {
          console.warn("Failed to load departments:", e);
          deps = [];
        }

        const role = getCurrentUserRole();
        const actions = document.createElement("div");
        actions.className = "mb-4 flex items-center justify-end gap-2";
        if (role === "admin") {
          actions.innerHTML = `
            <div id="addDeptWrap" class="flex items-center gap-2">
              <input id="newDeptName" placeholder="New department name" class="px-3 py-2 rounded-md text-white bg-gray-700" />
              <button id="addDeptBtn" class="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-3 py-2 rounded-md">Add Department</button>
            </div>
          `;
        }
        container.appendChild(actions);

        if (deps.length === 0) {
          const none = document.createElement("div");
          none.className = "text-gray-600";
          none.textContent = "No departments";
          container.appendChild(none);
        } else {
          const grid = document.createElement("div");
          grid.className =
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
          deps.forEach((d) => {
            const card = document.createElement("div");
            card.className =
              "p-4 bg-white/90 rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-shadow";
            card.innerHTML = `
              <div class="font-bold text-lg text-indigo-700">${escapeHtml(
                d.name
              )}</div>
              <div class="text-sm text-gray-600 mt-2">Click to view courses</div>
            `;
            card.addEventListener("click", () => showCoursesForDepartment(d));
            grid.appendChild(card);
          });
          container.appendChild(grid);
        }

        // Wire add department button
        const addDeptBtn = document.getElementById("addDeptBtn");
        if (addDeptBtn) {
          addDeptBtn.addEventListener("click", async () => {
            const input = document.getElementById("newDeptName");
            const name = input ? (input.value || "").trim() : "";
            if (!name) return alert("Provide department name");

            try {
              await window.API.addDepartment(name);
              const [users, materials, courses] = await Promise.all([
                window.API.getUsers().catch(() => []),
                window.API.getMaterials().catch(() => []),
                window.API.getCourses().catch(() => []),
              ]);
              if (totalUsersEl)
                totalUsersEl.textContent = String(users.length || 0);
              if (totalUploadsEl)
                totalUploadsEl.textContent = String(materials.length || 0);
              if (totalCoursesEl)
                totalCoursesEl.textContent = String(courses.length || 0);

              renderDepartments();
              if (input) input.value = "";
              alert("Department added successfully!");
            } catch (error) {
              console.error("Failed to add department:", error);
              alert("Failed to add department: " + error.message);
            }
          });
        }
      };

      // Show courses for selected department
      const showCoursesForDepartment = async (department) => {
        container.innerHTML =
          '<div class="text-white">Loading courses...</div>';
        let courses = [];
        try {
          courses = await window.API.getCoursesByDepartment(
            department._id || department.id
          );
        } catch (e) {
          console.warn("Failed to load courses:", e);
          courses = [];
        }

        container.innerHTML = "";
        const header = document.createElement("div");
        header.className = "mb-4";
        header.innerHTML = `
          <h2 class="text-2xl font-bold text-white mb-2">${escapeHtml(
            department.name
          )} - Courses</h2>
          <button id="backToDeps" class="bg-gray-300 text-black px-3 py-2 rounded-md">← Back to Departments</button>
        `;
        container.appendChild(header);

        const role = getCurrentUserRole();
        if (role === "admin") {
          const actions = document.createElement("div");
          actions.className = "mb-4 flex gap-2";
          actions.innerHTML = `
            <input id="newCourseCode" placeholder="Course Code" class="px-3 py-2 rounded-md text-white bg-gray-700" />
            <input id="newCourseName" placeholder="Course Name" class="px-3 py-2 rounded-md text-white bg-gray-700" />
            <button id="addCourseBtn" class="bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-3 py-2 rounded-md">Add Course</button>
          `;
          container.appendChild(actions);

          const addCourseBtn = document.getElementById("addCourseBtn");
          if (addCourseBtn) {
            addCourseBtn.addEventListener("click", async () => {
              const code = document
                .getElementById("newCourseCode")
                ?.value.trim();
              const name = document
                .getElementById("newCourseName")
                ?.value.trim();
              if (!code || !name) return alert("Provide course code and name");

              try {
                await window.API.addCourse(
                  department._id || department.id,
                  code,
                  name
                );
                showCoursesForDepartment(department);
                document.getElementById("newCourseCode").value = "";
                document.getElementById("newCourseName").value = "";
                alert("Course added successfully!");
              } catch (error) {
                console.error("Failed to add course:", error);
                alert("Failed to add course: " + error.message);
              }
            });
          }
        }

        if (courses.length === 0) {
          const none = document.createElement("div");
          none.className = "text-gray-600";
          none.textContent = "No courses in this department.";
          container.appendChild(none);
        } else {
          const grid = document.createElement("div");
          grid.className =
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
          courses.forEach((c) => {
            const card = document.createElement("div");
            card.className =
              "p-4 bg-white/90 rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-shadow";
            card.innerHTML = `
              <div class="font-bold text-lg text-teal-700">${escapeHtml(
                c.code
              )}</div>
              <div class="text-sm text-gray-700 mt-1">${escapeHtml(
                c.name
              )}</div>
            `;
            card.addEventListener("click", () =>
              showMaterialsForCourse(c, department)
            );
            grid.appendChild(card);
          });
          container.appendChild(grid);
        }

        const backBtn = document.getElementById("backToDeps");
        if (backBtn) backBtn.addEventListener("click", renderDepartments);
      };

      // Show materials for selected course
      const showMaterialsForCourse = async (course, department) => {
        container.innerHTML =
          '<div class="text-gray-500">Loading materials...</div>';
        let materials = [];
        try {
          materials = await window.API.getMaterialsByCourse(
            course._id || course.id
          );
        } catch (e) {
          console.warn("Failed to load materials:", e);
          materials = [];
        }

        const approved = materials.filter((m) => m.status === "approved");

        container.innerHTML = "";
        const header = document.createElement("div");
        header.className = "mb-4";
        header.innerHTML = `
          <h2 class="text-2xl font-bold text-white">${escapeHtml(
            course.code
          )} - ${escapeHtml(course.name)}</h2>
          <p class="text-sm text-gray-600 mt-1">${escapeHtml(
            department.name
          )}</p>
          <div class="mt-2 flex gap-2">
            <button id="backToCourses" class="bg-gray-300 text-black px-3 py-2 rounded-md">← Back to Courses</button>
            <button id="backToDeps2" class="bg-gray-300 text-black px-3 py-2 rounded-md">← Back to Departments</button>
          </div>
        `;
        container.appendChild(header);

        const role = getCurrentUserRole();
        const addWrap = document.createElement("div");
        addWrap.id = "addMaterialWrap";
        addWrap.className = "hidden mb-4 p-4 bg-white/90 rounded-xl";
        addWrap.innerHTML = `
          <h3 class="font-bold mb-2 text-white">Upload New Material (PDF)</h3>
          <form id="addMaterialForm" class="flex flex-col gap-2">
            <input name="title" placeholder="Material Title" required class="px-3 py-2 rounded-md text-black" />
            <input name="pdf" type="file" accept="application/pdf" required class="px-3 py-2 rounded-md text-black bg-amber-200" />
            <div class="flex gap-2">
              <button type="submit" class="bg-green-600 text-white px-3 py-2 rounded-md">Upload</button>
              <button type="button" id="cancelAddMaterial" class="bg-gray-400 text-white px-3 py-2 rounded-md">Cancel</button>
            </div>
          </form>
          <div id="addMaterialMsg" class="text-sm text-black mt-2"></div>
        `;
        container.appendChild(addWrap);

        const showAdd = document.createElement("button");
        showAdd.id = "showAddMaterial";
        showAdd.className =
          "mb-4 bg-indigo-600 text-white px-4 py-2 rounded-md";
        showAdd.textContent = "+ Upload Material";
        container.appendChild(showAdd);

        if (approved.length === 0) {
          const none = document.createElement("div");
          none.className = "text-gray-600";
          none.textContent = "No approved materials yet.";
          container.appendChild(none);
        } else {
          const list = document.createElement("div");
          list.className = "flex flex-col gap-3";
          approved.forEach((m) => {
            const item = document.createElement("div");
            item.className =
              "p-3 bg-white/90 rounded-xl flex items-center justify-between";
            const uploaderName = m.uploader
              ? m.uploader.name || m.uploader
              : "Unknown";
            const downloadUrl = `${window.API.baseURL}/materials/${
              m._id || m.id
            }/download`;
            item.innerHTML = `
              <div>
                <div class="font-semibold text-black">${escapeHtml(
                  m.title
                )}</div>
                <div class="text-sm text-gray-600">Uploaded by ${escapeHtml(
                  uploaderName
                )}</div>
              </div>
              <a href="${downloadUrl}" target="_blank" class="bg-teal-600 text-white px-3 py-1 rounded-md">Download PDF</a>
            `;
            list.appendChild(item);
          });
          container.appendChild(list);
        }

        // Wire upload material button
        const showAddBtn = document.getElementById("showAddMaterial");
        const cancelAdd = document.getElementById("cancelAddMaterial");
        const addForm = document.getElementById("addMaterialForm");
        const addMsg = document.getElementById("addMaterialMsg");

        if (showAddBtn && addWrap) {
          showAddBtn.addEventListener("click", () => {
            addWrap.classList.remove("hidden");
            showAddBtn.classList.add("hidden");
          });
        }

        if (cancelAdd && addWrap && showAddBtn) {
          cancelAdd.addEventListener("click", () => {
            addWrap.classList.add("hidden");
            showAddBtn.classList.remove("hidden");
            if (addMsg) addMsg.textContent = "";
            if (addForm) addForm.reset();
          });
        }

        if (addForm) {
          addForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(addForm);
            const title = (fd.get("title") || "").trim();
            const currentUser = getCurrentUser();
            const file = addForm.querySelector('input[name="pdf"]').files[0];

            if (!title) return alert("Provide a title");
            if (!file) {
              if (addMsg) addMsg.textContent = "Please select a PDF file.";
              return;
            }
            if (file.type !== "application/pdf") {
              if (addMsg) addMsg.textContent = "Only PDF files are allowed.";
              return;
            }
            if (file.size > 20 * 1024 * 1024) {
              if (addMsg) addMsg.textContent = "PDF size must be 20MB or less.";
              return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("courseId", course._id || course.id);
            formData.append("file", file);

            try {
              if (addMsg) addMsg.textContent = "Uploading...";
              await window.API.uploadMaterial(formData);
              if (addMsg)
                addMsg.textContent =
                  "PDF uploaded successfully — pending approval.";
              addForm.reset();
              setTimeout(() => {
                showMaterialsForCourse(course, department);
              }, 600);
            } catch (error) {
              console.error("Failed to upload material:", error);
              if (addMsg)
                addMsg.textContent = "Upload failed: " + error.message;
            }
          });
        }

        const backBtn = document.getElementById("backToCourses");
        if (backBtn)
          backBtn.addEventListener("click", () =>
            showCoursesForDepartment(department)
          );

        const backDepsBtn = document.getElementById("backToDeps2");
        if (backDepsBtn)
          backDepsBtn.addEventListener("click", renderDepartments);
      };

      renderDepartments();
    } catch (e) {
      console.error("initDashboard error", e);
    }
  },
};
