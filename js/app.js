    document.addEventListener('DOMContentLoaded', () => {
      // Elements
      const showRegisterBtn = document.getElementById('showRegister');
      const quoteView = document.getElementById('quoteView');
      const registerView = document.getElementById('registerView');
      const uploadBtn = document.getElementById('uploadBtn');
      const profilePicInput = document.getElementById('profilePicInput');
      const preview = document.getElementById('preview');
      const profilePicEl = document.getElementById('profilePic');
      const cancelRegister = document.getElementById('cancelRegister');
      const registerForm = document.getElementById('registerForm');
      const loginForm = document.getElementById('loginForm');
      const loginPanel = document.getElementById('loginPanel');
      const basePanel = document.getElementById('Base');
      const dashboardEl = document.getElementById('dashboard');
      const currentUserEl = document.getElementById('currentUser');
      const bannerEl = document.getElementById('Banner');

      // Compute sidebar labels and fragment map based on role
      function getRoleConfig(role) {
        role = (role || '').toLowerCase();
        const base = ['DASHBOARD', 'MY UPLOADS', 'MY PROFILE'];
        if (role === 'moderator') {
          return {
            labels: [...base, 'APPROVE UPLOADS'],
            map: Object.assign({}, fragmentMapBase, { 'APPROVE UPLOADS': 'fragments/approveUploads.html' })
          };
        }
        if (role === 'admin') {
          return {
            labels: [...base, 'APPROVE UPLOADS', 'USER MANAGEMENT'],
            map: Object.assign({}, fragmentMapBase, { 'APPROVE UPLOADS': 'fragments/approveUploads.html', 'USER MANAGEMENT': 'fragments/userManagement.html' })
          };
        }
        // default student
        return { labels: base, map: Object.assign({}, fragmentMapBase) };
      }

      // Helper: render sidebar buttons as buttons (not links)
      function renderSidebarButtons() {
        const sidebar = document.getElementById('Sidebar');
        if (!sidebar) return;
        // remove previously generated buttons
        Array.from(sidebar.querySelectorAll('[data-generated="true"]')).forEach(n => n.remove());

        sidebarButtonLabels.forEach(label => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.generated = 'true';
          btn.textContent = label;
          btn.className = 'block bg-white text-black w-full py-3 rounded-2xl font-semibold hover:bg-gray-200 text-center mb-3';
          btn.addEventListener('click', () => showSection(label));
          sidebar.appendChild(btn);
        });

        // Logout button
        const logout = document.createElement('button');
        logout.type = 'button';
        logout.dataset.generated = 'true';
        logout.textContent = 'LOGOUT';
        logout.className = 'block bg-red-600 text-white w-full py-3 rounded-2xl font-semibold hover:bg-red-700 text-center mt-2';
        logout.addEventListener('click', () => {
          // show login panel again
          basePanel.classList.add('hidden');
          loginPanel.classList.remove('hidden');
        });
        sidebar.appendChild(logout);
      }

      // fragment cache
      const fragmentCache = new Map();

      // base fragment mapping
      const fragmentMapBase = {
        'DASHBOARD': 'fragments/dashboard.html',
        'MY UPLOADS': 'fragments/myUploads.html',
        'MY PROFILE': 'fragments/myProfile.html'
      };

      // current fragment map & labels (will be set on login)
      let fragmentMap = Object.assign({}, fragmentMapBase);
      let sidebarButtonLabels = ['DASHBOARD', 'MY UPLOADS', 'MY PROFILE'];

      // helper to get current user's role from mock App
      function getCurrentUserRole() {
        try {
          return (window.App && window.App.currentUser && window.App.currentUser.role) ? window.App.currentUser.role : 'student';
        } catch (e) { return 'student'; }
      }

      // simple section switcher that loads fragment HTML into dashboard (cached)
      async function showSection(label) {
        if (!dashboardEl) return;
        // update banner to reflect current panel
        try {
          if (bannerEl && label) bannerEl.textContent = label;
        } catch (e) { /* ignore */ }
        const path = fragmentMap[label];
        if (!path) return;
        // use cache
        if (fragmentCache.has(path)) {
          dashboardEl.innerHTML = fragmentCache.get(path);
          // run any fragment-specific init
          runFragmentInit(path);
          return;
        }
        try {
          const res = await fetch(path);
          if (!res.ok) throw new Error('Failed to load ' + path);
          const html = await res.text();
          fragmentCache.set(path, html);
          dashboardEl.innerHTML = html;
          // run any fragment-specific init
          runFragmentInit(path);
        } catch (err) {
          dashboardEl.innerHTML = `<div class="text-red-400">Error loading section: ${err.message}</div>`;
          console.error(err);
        }
      }

      // Run per-fragment initialization (hook after fragment injection)
      function runFragmentInit(path) {
        if (!path) return;
        // normalize
        const p = path.replace(/\\\\/g, '/');
        if (p.endsWith('approveUploads.html')) {
          initApproveUploads();
        }
        if (p.endsWith('userManagement.html')) {
          initUserManagement();
        }
        if (p.endsWith('dashboard.html')) {
          initDashboard();
        }
        if (p.endsWith('myUploads.html')) {
          initMyUploads();
        }
        if (p.endsWith('myProfile.html')) {
          initMyProfile();
        }
        // other fragments can be added here
      }

      // Initialize Dashboard fragment: show departments, and swap to courses grid when clicked
      function initDashboard() {
        try {
          const container = document.getElementById('departmentsContainer');
          const totalUsersEl = document.getElementById('totalUsersCount');
          const totalUploadsEl = document.getElementById('totalUploadsCount');
          const totalCoursesEl = document.getElementById('totalCoursesCount');
          if (!container) return;

          // populate top stats
          try {
            const users = (window.App && window.App.users) ? window.App.users : [];
            const materials = (window.App && window.App.materials) ? window.App.materials : [];
            const courses = (window.App && window.App.courses) ? window.App.courses : [];
            if (totalUsersEl) totalUsersEl.textContent = String(users.length || 0);
            if (totalUploadsEl) totalUploadsEl.textContent = String(materials.length || 0);
            if (totalCoursesEl) totalCoursesEl.textContent = String(courses.length || 0);
          } catch (e) { /* ignore stats render errors */ }

          function renderDepartments() {
            container.innerHTML = '';
            const deps = (window.App && window.App.departments) ? window.App.departments.slice() : [];

            // actions area (admin only)
            const role = getCurrentUserRole();
            const actions = document.createElement('div');
            actions.className = 'mb-4 flex items-center justify-end gap-2';
            if (role === 'admin') {
              actions.innerHTML = `
                <div id="addDeptWrap" class="flex items-center gap-2">
                  <input id="newDeptName" placeholder="New department name" class="px-3 py-2 rounded-md text-black" />
                  <button id="addDeptBtn" class="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-3 py-2 rounded-md">Add Department</button>
                </div>
              `;
            }
            container.appendChild(actions);

            if (deps.length === 0) {
              const none = document.createElement('div');
              none.className = 'text-gray-600';
              none.textContent = 'No departments';
              container.appendChild(none);
              // still wire add dept button if present
              const addDeptBtnEmpty = document.getElementById('addDeptBtn');
              if (addDeptBtnEmpty) {
                addDeptBtnEmpty.addEventListener('click', () => {
                  const input = document.getElementById('newDeptName');
                  const name = input ? (input.value || '').trim() : '';
                  if (!name) return alert('Provide department name');
                  if (window.App && typeof window.App.addDepartment === 'function') {
                    window.App.addDepartment(name);
                    // refresh stats and re-render
                    try { if (totalCoursesEl) totalCoursesEl.textContent = String((window.App.courses || []).length); } catch (e) {}
                    try { if (totalUploadsEl) totalUploadsEl.textContent = String((window.App.materials || []).length); } catch (e) {}
                    try { if (totalUsersEl) totalUsersEl.textContent = String((window.App.users || []).length); } catch (e) {}
                    renderDepartments();
                  }
                });
              }
              return;
            }

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-2 gap-6';
            deps.forEach(d => {
              const btn = document.createElement('button');
              btn.className = 'bg-gradient-to-r from-teal-500 to-indigo-600 py-6 rounded-2xl text-center font-bold hover:scale-105 transition';
              btn.textContent = d.name;
              btn.addEventListener('click', () => showCoursesForDepartment(d));
              grid.appendChild(btn);
            });
            container.appendChild(grid);

            // wire add department action when list present
            const addDeptBtn = document.getElementById('addDeptBtn');
            if (addDeptBtn) {
              addDeptBtn.addEventListener('click', () => {
                const input = document.getElementById('newDeptName');
                const name = input ? (input.value || '').trim() : '';
                if (!name) return alert('Provide department name');
                if (window.App && typeof window.App.addDepartment === 'function') {
                  window.App.addDepartment(name);
                  // refresh stats
                  try { if (totalCoursesEl) totalCoursesEl.textContent = String((window.App.courses || []).length); } catch (e) {}
                  try { if (totalUploadsEl) totalUploadsEl.textContent = String((window.App.materials || []).length); } catch (e) {}
                  try { if (totalUsersEl) totalUsersEl.textContent = String((window.App.users || []).length); } catch (e) {}
                  renderDepartments();
                }
              });
            }
          }

          function showCoursesForDepartment(department) {
            // create courses grid markup similar to courses.html
            const courses = (window.App && window.App.courses) ? window.App.courses.filter(c => c.departmentId === department.id) : [];
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-xl font-bold">${escapeHtml(department.name)} — Courses</h3>
                <button id="backToDeps" class="text-sm bg-white/90 text-black px-3 py-1 rounded-md">Back</button>
              </div>
              <div id="courseActions" class="mb-4 flex items-center justify-end"></div>
            `;
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-6';
            if (courses.length === 0) {
              grid.innerHTML = '<div class="text-gray-700 p-4">No courses for this department.</div>';
            } else {
              courses.forEach(c => {
                const b = document.createElement('button');
                b.className = 'bg-gradient-to-r from-teal-500 to-indigo-600 py-6 rounded-2xl text-center font-bold hover:scale-105 transition';
                b.textContent = c.name;
                  // clicking a course opens the materials panel for that course
                  b.addEventListener('click', () => showMaterialsForCourse(c, department));
                grid.appendChild(b);
              });
            }
            wrapper.appendChild(grid);
            container.innerHTML = '';
            container.appendChild(wrapper);
            // add course control for admin/moderator
            try {
              const role2 = getCurrentUserRole();
              const courseActions = document.getElementById('courseActions');
              if (courseActions && (role2 === 'admin' || role2 === 'moderator')) {
                courseActions.innerHTML = `
                  <div id="addCourseWrap" class="flex items-center gap-2">
                    <input id="newCourseName" placeholder="Course name" class="px-3 py-2 rounded-md text-black" />
                    <input id="newCourseCode" placeholder="Code" class="px-3 py-2 rounded-md text-black" />
                    <button id="addCourseBtn" class="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-3 py-2 rounded-md">Add Course</button>
                  </div>
                `;
                const addCourseBtn = document.getElementById('addCourseBtn');
                if (addCourseBtn) {
                  addCourseBtn.addEventListener('click', () => {
                    const name = (document.getElementById('newCourseName')?.value || '').trim();
                    const code = (document.getElementById('newCourseCode')?.value || '').trim();
                    if (!name || !code) return alert('Provide course name and code');
                    if (window.App && typeof window.App.addCourse === 'function') {
                      window.App.addCourse(department.id, name, code);
                      try { if (totalCoursesEl) totalCoursesEl.textContent = String((window.App.courses || []).length); } catch (e) {}
                      showCoursesForDepartment(department);
                    }
                  });
                }
              }
            } catch (e) { /* ignore */ }
            const back = document.getElementById('backToDeps');
            if (back) back.addEventListener('click', renderDepartments);
          }

          // Show materials for a given course
          function showMaterialsForCourse(course, department) {
            // Show approved materials plus any pending materials uploaded by the current user
            const currentUserName = (window.App && window.App.currentUser) ? window.App.currentUser.name : null;
            const materials = (window.App && window.App.materials) ? window.App.materials.filter(m => {
              const sameCourse = (m.courseCode || '').toLowerCase() === (course.code || '').toLowerCase();
              const allowed = m.status === 'approved' || (currentUserName && m.uploader === currentUserName);
              return sameCourse && allowed;
            }) : [];
            const wrap = document.createElement('div');
            wrap.innerHTML = `
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h3 class="text-xl font-bold">${escapeHtml(course.name)} <span class="text-sm text-gray-600">(${escapeHtml(course.code || '')})</span></h3>
                  <div class="text-sm text-gray-600">Department: ${escapeHtml(department.name)}</div>
                </div>
                <div class="flex items-center gap-2">
                  <button id="backToCourses" class="text-sm bg-white/90 text-black px-3 py-1 rounded-md">Back</button>
                  <button id="backToDeps2" class="text-sm bg-white/80 text-black px-3 py-1 rounded-md">Departments</button>
                </div>
              </div>
              <div class="mb-4 flex items-center justify-between">
                <div class="text-sm text-gray-700">Add new material for this course</div>
                <div>
                  <button id="showAddMaterial" class="bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-3 py-1 rounded-md text-sm">Add Material</button>
                </div>
              </div>
              <div id="addMaterialFormWrap" class="mb-4 hidden">
                <form id="addMaterialForm" class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <input name="title" placeholder="Material title" required class="px-3 py-2 rounded-md text-black col-span-2" />
                  <input name="uploader" placeholder="Your name" class="px-3 py-2 rounded-md text-black" />
                  <input name="pdf" type="file" accept="application/pdf" required class="px-3 py-2 rounded-md text-black col-span-3" />
                  <div class="col-span-3 flex items-center gap-2">
                    <button type="submit" class="bg-green-600 text-white px-3 py-1 rounded-md">Upload PDF</button>
                    <button type="button" id="cancelAddMaterial" class="bg-gray-300 text-black px-3 py-1 rounded-md">Cancel</button>
                    <div id="addMaterialMsg" class="text-sm text-gray-700 ml-4"></div>
                  </div>
                </form>
              </div>
            `;

            const list = document.createElement('div');
            list.className = 'space-y-3';
            if (materials.length === 0) {
              list.innerHTML = '<div class="text-gray-700 p-4">No approved materials for this course.</div>';
            } else {
              materials.forEach(m => {
                const item = document.createElement('div');
                item.className = 'p-3 bg-white/80 rounded-xl flex items-center justify-between';
                item.innerHTML = `
                  <div>
                    <div class="font-semibold">${escapeHtml(m.title)}</div>
                    <div class="text-sm text-gray-600">${escapeHtml(m.courseCode)} — uploaded by ${escapeHtml(m.uploader)} ${m.status === 'pending' ? '<span class="text-yellow-700">(pending)</span>' : ''}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="px-2 py-1 rounded-full text-sm font-medium ${statusClass(m.status)}">${m.status}</div>
                    <button class="viewBtn bg-teal-500 text-white px-3 py-1 rounded-md text-sm">View</button>
                  </div>
                `;
                list.appendChild(item);
                // view button triggers PDF download if available
                const viewBtn = item.querySelector('.viewBtn');
                if (viewBtn) {
                  viewBtn.addEventListener('click', () => {
                    if (m.pdf && typeof m.pdf === 'string') {
                      const a = document.createElement('a');
                      a.href = m.pdf;
                      a.download = (m.title || 'material') + '.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else {
                      alert('No PDF available for this material.');
                    }
                  });
                }
              });
            }

            wrap.appendChild(list);
            container.innerHTML = '';
            container.appendChild(wrap);

            // wire add material UI
            const showAdd = document.getElementById('showAddMaterial');
            const addWrap = document.getElementById('addMaterialFormWrap');
            const addForm = document.getElementById('addMaterialForm');
            const cancelAdd = document.getElementById('cancelAddMaterial');
            const addMsg = document.getElementById('addMaterialMsg');
            if (showAdd && addWrap) {
              showAdd.addEventListener('click', () => {
                addWrap.classList.remove('hidden');
                showAdd.classList.add('hidden');
                // prefill uploader
                const up = addForm && addForm.querySelector('input[name="uploader"]');
                if (up) up.value = (window.App && window.App.currentUser && window.App.currentUser.name) ? window.App.currentUser.name : '';
              });
            }
            if (cancelAdd && addWrap && showAdd) {
              cancelAdd.addEventListener('click', () => {
                addWrap.classList.add('hidden');
                showAdd.classList.remove('hidden');
                addMsg.textContent = '';
                addForm && addForm.reset();
              });
            }
            if (addForm) {
              addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(addForm);
                const title = (fd.get('title') || '').trim();
                const uploader = (fd.get('uploader') || '').trim() || (window.App && window.App.currentUser && window.App.currentUser.name) || 'guest';
                const file = addForm.querySelector('input[name="pdf"]').files[0];
                if (!title) return alert('Provide a title');
                if (!file) return addMsg.textContent = 'Please select a PDF file.';
                if (file.type !== 'application/pdf') return addMsg.textContent = 'Only PDF files are allowed.';
                if (file.size > 20 * 1024 * 1024) return addMsg.textContent = 'PDF size must be 20MB or less.';
                const reader = new FileReader();
                reader.onload = function() {
                  if (window.App && typeof window.App.addMaterial === 'function') {
                    // Store PDF as data URL (demo only)
                    window.App.addMaterial(title, course.code || course.name, uploader, reader.result);
                    addMsg.textContent = 'PDF uploaded (demo) — pending approval.';
                    addForm.reset();
                    setTimeout(() => {
                      showMaterialsForCourse(course, department);
                    }, 600);
                  }
                };
                reader.readAsDataURL(file);
              });
            }

            const backBtn = document.getElementById('backToCourses');
            if (backBtn) backBtn.addEventListener('click', () => showCoursesForDepartment(department));
            const backDepsBtn = document.getElementById('backToDeps2');
            if (backDepsBtn) backDepsBtn.addEventListener('click', renderDepartments);
          }

          renderDepartments();
        } catch (e) {
          console.error('initDashboard error', e);
        }
      }

      // Initialize Approve Uploads fragment: render materials and wire approve/deny/filter
      function initApproveUploads() {
        try {
          const container = document.getElementById('materialsContainer');
          const filter = document.getElementById('filterStatus');
          if (!container) return;

          function renderMaterials(statusFilter) {
            const items = (window.App && window.App.materials) ? window.App.materials.slice() : [];
            const filtered = (statusFilter && statusFilter !== 'all') ? items.filter(i => i.status === statusFilter) : items;
            container.innerHTML = '';
            if (filtered.length === 0) {
              container.innerHTML = '<div class="text-gray-400">No materials found.</div>';
              return;
            }
            filtered.forEach(m => {
              const el = document.createElement('div');
              el.className = 'p-3 bg-white/80 rounded-xl flex items-center justify-between';
              el.innerHTML = `
                <div>
                  <div class="font-semibold">${escapeHtml(m.title)}</div>
                  <div class="text-sm text-gray-600">${escapeHtml(m.courseCode)} — uploaded by ${escapeHtml(m.uploader)}</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="px-2 py-1 rounded-full text-sm font-medium ${statusClass(m.status)}">${m.status}</div>
                  ${m.status === 'pending' ? `<button data-id="${m.id}" data-action="approve" class="approve-btn bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                  <button data-id="${m.id}" data-action="deny" class="deny-btn bg-red-600 text-white px-3 py-1 rounded-md text-sm">Deny</button>` : ''}
                </div>
              `;
              container.appendChild(el);
            });

            // attach listeners
            Array.from(container.querySelectorAll('.approve-btn')).forEach(b => {
              b.addEventListener('click', (e) => {
                const id = Number(b.dataset.id);
                if (window.App && typeof window.App.changeMaterialStatus === 'function') {
                  window.App.changeMaterialStatus(id, 'approved');
                  renderMaterials(filter?.value || 'all');
                }
              });
            });
            Array.from(container.querySelectorAll('.deny-btn')).forEach(b => {
              b.addEventListener('click', (e) => {
                const id = Number(b.dataset.id);
                if (window.App && typeof window.App.changeMaterialStatus === 'function') {
                  window.App.changeMaterialStatus(id, 'denied');
                  renderMaterials(filter?.value || 'all');
                }
              });
            });
          }

          // wire filter
          if (filter) {
            filter.addEventListener('change', () => renderMaterials(filter.value));
          }
          // initial render
          renderMaterials(filter?.value || 'all');
        } catch (e) {
          console.error('initApproveUploads error', e);
        }
      }

      // small helpers
      function statusClass(status) {
        if (!status) return 'bg-gray-200 text-gray-800';
        if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
        if (status === 'approved') return 'bg-green-100 text-green-800';
        if (status === 'denied') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
      }

      function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      // Initialize User Management fragment
      function initUserManagement() {
        try {
          const container = document.getElementById('usersContainer');
          const addForm = document.getElementById('addUserForm');
          if (!container) return;

          function renderUsers() {
            container.innerHTML = '';
            const users = (window.App && window.App.users) ? window.App.users.slice() : [];
            if (users.length === 0) { container.innerHTML = '<div class="text-black">No users</div>'; return; }
            users.forEach(u => {
              const row = document.createElement('div');
              row.className = 'flex items-center justify-between bg-white/10 p-3 rounded-md';
              row.innerHTML = `
                <div>
                  <div class="font-semibold">${escapeHtml(u.name)}</div>
                  <div class="text-sm text-black">${escapeHtml(u.email)}</div>
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
              const select = row.querySelector('.roleSelect');
              select.value = u.role || 'student';
              const saveBtn = row.querySelector('.saveRoleBtn');
              saveBtn.addEventListener('click', () => {
                if (window.App && typeof window.App.updateUserRole === 'function') {
                  window.App.updateUserRole(u.id, select.value);
                  renderUsers();
                  alert(`Role updated for ${u.name}: ${select.value}`);
                }
              });
            });
          }

          if (addForm) {
            addForm.addEventListener('submit', (e) => {
              e.preventDefault();
              const fd = new FormData(addForm);
              const name = (fd.get('name') || '').trim();
              const email = (fd.get('email') || '').trim().toLowerCase();
              if (!name || !email) return alert('Provide name and email');
              if (window.App && typeof window.App.register === 'function') {
                window.App.register({ name, email });
                addForm.reset();
                renderUsers();
                alert('User added (demo)');
              }
            });
          }

          renderUsers();
        } catch (e) {
          console.error('initUserManagement error', e);
        }
      }

      // Initialize My Uploads fragment: list materials uploaded by current user
      function initMyUploads() {
        try {
          const container = document.getElementById('myUploadsList');
          if (!container) return;
          const me = (window.App && window.App.currentUser) ? window.App.currentUser : null;
          const uid = me ? me.name : null; // uploader stored as name in mock data

          function render() {
            container.innerHTML = '';
            const all = (window.App && window.App.materials) ? window.App.materials.slice() : [];
            let mine = uid ? all.filter(m => m.uploader === uid) : [];

            // Ensure the current user has at least 3 mock uploads so the UI always shows examples.
            if (uid && window.App && typeof window.App.addMaterial === 'function') {
              try {
                const desired = 3;
                const existingCount = mine.length;
                const need = Math.max(0, desired - existingCount);
                const courseCodes = (window.App.courses || []).map(c => c.code).filter(Boolean);
                const sampleTitles = [
                  'Lecture Notes',
                  'Assignment Solutions',
                  'Exam Past Questions',
                  'Tutorial Slides',
                  'Practical Lab Manual',
                  'Project Report'
                ];
                for (let i = 0; i < need; i++) {
                  const title = `${uid} — ${sampleTitles[Math.floor(Math.random() * sampleTitles.length)]}`;
                  const code = courseCodes.length ? courseCodes[Math.floor(Math.random() * courseCodes.length)] : `CSE3${1 + Math.floor(Math.random() * 8)}`;
                  const m = window.App.addMaterial(title, code, uid);
                  // make one randomly approved so course views may show something
                  if (i === 0 && window.App.changeMaterialStatus) window.App.changeMaterialStatus(m.id, 'approved');
                }
                const refreshed = (window.App && window.App.materials) ? window.App.materials.slice() : [];
                mine = uid ? refreshed.filter(m => m.uploader === uid) : [];
              } catch (e) {
                console.warn('failed to create sample uploads', e);
              }
            }

            if (mine.length === 0) { container.innerHTML = '<div class="text-gray-700">You have not uploaded any materials.</div>'; return; }
            mine.forEach(m => {
              const row = document.createElement('div');
              row.className = 'relative';
              row.innerHTML = `
                <div class="pr-16">
                  <button class="w-full text-left bg-gradient-to-r from-teal-500 to-indigo-600 text-black rounded-3xl m-2 py-3 px-3 text-xl font-semibold transform transition duration-150 hover:shadow-md hover:text-white hover:from-indigo-700 hover:to-indigo-800">${escapeHtml(m.title)} <div class="text-sm text-gray-700">${escapeHtml(m.courseCode)} • ${escapeHtml(m.status)}</div></button>
                </div>
                <button aria-label="delete" class="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-full shadow-md hover:scale-105 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                  </svg>
                </button>
              `;
              container.appendChild(row);
              const del = row.querySelector('button[aria-label="delete"]');
              if (del) del.addEventListener('click', () => {
                if (window.App && typeof window.App.changeMaterialStatus === 'function') {
                  window.App.changeMaterialStatus(m.id, 'denied');
                  render();
                }
              });
            });
          }

          render();
        } catch (e) {
          console.error('initMyUploads error', e);
        }
      }

      // Initialize My Profile fragment: show profile details and allow editing (demo persistence)
      function initMyProfile() {
        try {
          const nameEl = document.getElementById('profileName');
          const studentIdEl = document.getElementById('profileStudentId');
          const deptEl = document.getElementById('profileDept');
          const intakeEl = document.getElementById('profileIntake');
          const actionsEl = document.getElementById('profileActions');
          const user = (window.App && window.App.currentUser) ? window.App.currentUser : null;
          if (!nameEl || !actionsEl) return;

          function renderView() {
            if (!user) {
              nameEl.textContent = 'Guest';
              idEl.textContent = '-';
              sectionEl.textContent = '-';
              deptEl.textContent = '-';
              intakeEl.textContent = '-';
              actionsEl.innerHTML = '<div class="text-sm text-gray-400">Log in to edit your profile.</div>';
              return;
            }
            nameEl.textContent = user.name || user.email || 'User';
            // student id, intake and gender shown in fragment
            if (studentIdEl) studentIdEl.textContent = user.studentId || '-';
            if (intakeEl) intakeEl.textContent = user.intake || '-';
            deptEl.textContent = user.department || '-';
            // additional fields
            const emailEl = document.getElementById('profileEmail'); if (emailEl) emailEl.textContent = user.email || '-';
            const genderEl = document.getElementById('profileGender'); if (genderEl) genderEl.textContent = user.gender || '-';
            // render persistent picture controls and edit button
            actionsEl.innerHTML = `
              <div id="profilePicEditPersistent" class="flex items-center gap-4 mb-3">
                <input id="profilePicInputPersistent" type="file" accept="image/*" class="hidden" />
                <button id="changePicBtnPersistent" class="bg-white text-black px-4 py-2 rounded-md">Change Picture</button>
                <img id="profilePreviewPersistent" src="" alt="preview" class="w-16 h-16 object-cover rounded-md ${ (user && user.profilePic) ? '' : 'hidden' }" />
              </div>
              <div>
                <button id="editBtn" class="bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-90">Edit Profile</button>
              </div>
            `;
            const editBtn = document.getElementById('editBtn');
            if (editBtn) editBtn.addEventListener('click', showEdit);
            // wire persistent picture controls
            try {
              const changeBtn = document.getElementById('changePicBtnPersistent');
              const picInput = document.getElementById('profilePicInputPersistent');
              const picPreview = document.getElementById('profilePreviewPersistent');
              if (changeBtn && picInput) {
                changeBtn.addEventListener('click', () => picInput.click());
              }
              if (picInput) {
                picInput.addEventListener('change', (ev) => {
                  const f = ev.target.files && ev.target.files[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    try {
                      const data = r.result;
                      if (picPreview) { picPreview.src = data; picPreview.classList.remove('hidden'); }
                      // persist to state
                      const state = window.__APP_STATE;
                      const u = state && state.users ? state.users.find(x => x.email === (user.email || '')) : null;
                      if (u) {
                        u.profilePic = data;
                        try { localStorage.setItem('bubt_demo_app_v1', JSON.stringify(state)); } catch (e) {}
                        try { renderProfilePic(); } catch (e) {}
                      }
                    } catch (err) { console.warn('profile pic save failed', err); }
                  };
                  r.readAsDataURL(f);
                });
              }
            } catch (err) { /* ignore */ }
          }

          function showEdit() {
            // open modal and populate fields
            try {
              const modal = document.getElementById('editProfileModal');
              const form = document.getElementById('editProfileForm');
              if (!modal || !form) return;
              // populate
              form.elements['name'].value = user.name || '';
              form.elements['email'].value = user.email || '';
              form.elements['studentId'].value = user.studentId || '';
              form.elements['gender'].value = user.gender || '';
              form.elements['department'].value = user.department || '';
              form.elements['section'].value = (user.section != null) ? String(user.section) : '';
              form.elements['intake'].value = user.intake || '';
              modal.classList.remove('hidden');

              const cancelBtn = document.getElementById('cancelEditProfile');
              if (cancelBtn) cancelBtn.onclick = () => { modal.classList.add('hidden'); };

              form.onsubmit = (e) => {
                e.preventDefault();
                const fd = new FormData(form);
                const newName = (fd.get('name') || '').trim();
                const newEmail = (fd.get('email') || '').trim().toLowerCase();
                const newStudentId = (fd.get('studentId') || '').trim();
                const newGender = (fd.get('gender') || '').trim();
                const newDept = (fd.get('department') || '').trim();
                const newSection = (fd.get('section') || '').trim();
                const newIntake = (fd.get('intake') || '').trim();
                try {
                  const state = window.__APP_STATE;
                  if (state && state.users) {
                    const u = state.users.find(x => x.email === (user.email || ''));
                    if (u) {
                      u.name = newName || u.name;
                      u.email = newEmail || u.email;
                      u.studentId = newStudentId || u.studentId;
                      u.gender = newGender || u.gender;
                      u.department = newDept || u.department;
                      u.section = newSection || u.section;
                      u.intake = newIntake || u.intake;
                      try { localStorage.setItem('bubt_demo_app_v1', JSON.stringify(state)); } catch (e) {}
                      // re-render and close
                      renderView();
                      try { renderProfilePic(); } catch (e) {}
                      modal.classList.add('hidden');
                    }
                  }
                } catch (err) { console.error('profile save failed', err); }
              };
            } catch (err) { console.error('open modal failed', err); }
          }

          renderView();
        } catch (e) {
          console.error('initMyProfile error', e);
        }
      }

      // Toggle to registration view
      if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
          quoteView.classList.add('hidden');
          registerView.classList.remove('hidden');
          if (loginForm) loginForm.classList.add('hidden');
          // move focus to first input
          const first = registerForm && registerForm.querySelector('input[name="name"]');
          if (first) first.focus();
        });
      }

      // Cancel registration -> back to quote/login
      if (cancelRegister) {
        cancelRegister.addEventListener('click', () => {
          registerView.classList.add('hidden');
          quoteView.classList.remove('hidden');
          if (loginForm) loginForm.classList.remove('hidden');
          if (registerForm) registerForm.reset();
          if (preview) { preview.src = ''; preview.classList.add('hidden'); }
        });
      }

      // Upload button triggers hidden file input
      if (uploadBtn && profilePicInput) {
        uploadBtn.addEventListener('click', () => profilePicInput.click());
        profilePicInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => { if (preview) { preview.src = reader.result; preview.classList.remove('hidden'); } };
          reader.readAsDataURL(file);
        });
      }

      // helper to render profile picture in the sidebar
      function renderProfilePic() {
        try {
          const cu = (window.App && window.App.currentUser) ? window.App.currentUser : null;
          const img = document.getElementById('profilePicImg');
          const fallback = document.getElementById('profilePicFallback');
          if (!img || !fallback) return;
          if (cu && cu.profilePic) {
            img.src = cu.profilePic;
            img.classList.remove('hidden');
            fallback.classList.add('hidden');
          } else {
            img.src = '';
            img.classList.add('hidden');
            fallback.classList.remove('hidden');
          }
        } catch (e) { /* ignore */ }
      }

      // Simple register handling (client-side demo) using App.register
      if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(registerForm).entries());
          if (data.password !== data.confirmPassword) {
            alert('Passwords do not match.');
            return;
          }
          if (window.App && typeof window.App.register === 'function') {
            // include profile pic data URL if present in preview
            const pic = (preview && preview.src) ? preview.src : '';
            const user = window.App.register({ name: data.name, email: data.email, password: data.password, department: data.department, intake: data.intake, profilePic: pic });
            if (user) {
              alert('Registered (demo): ' + (user.name || user.email));
              registerForm.reset();
              if (preview) { preview.src = ''; preview.classList.add('hidden'); }
              registerView.classList.add('hidden');
              quoteView.classList.remove('hidden');
              if (loginForm) loginForm.classList.remove('hidden');
            }
          }
        });
      }

  // Login button hides loginPanel and shows Base
      if (loginForm) {
        const loginBtn = document.getElementById('loginBtn') || loginForm.querySelector('button');
        const resetDemoBtn = document.getElementById('resetDemoBtn');
        if (resetDemoBtn) {
          resetDemoBtn.addEventListener('click', () => {
            if (window.App && typeof window.App.resetToSeed === 'function') {
              window.App.resetToSeed();
              location.reload();
            }
          });
        }
        if (loginBtn) {
          loginBtn.addEventListener('click', () => {
            const emailVal = document.getElementById('loginEmail')?.value?.toLowerCase() || '';
            const passVal = document.getElementById('loginPassword')?.value || '';
            if (window.App && typeof window.App.login === 'function') {
              const u = window.App.login(emailVal, passVal);
              if (!u) return alert('Invalid credentials (demo)');
              const roleFromUser = (u.role || 'student');
              const cfg = getRoleConfig(roleFromUser);
              sidebarButtonLabels = cfg.labels;
              fragmentMap = cfg.map;
              if (loginPanel) loginPanel.classList.add('hidden');
              if (basePanel) basePanel.classList.remove('hidden');
              renderSidebarButtons();
              // set displayed current user name
              try {
                if (currentUserEl) currentUserEl.textContent = u.name || u.email || 'User';
                // render profile picture
                try { renderProfilePic(); } catch (e) {}
              } catch (e) {}
              showSection('DASHBOARD');
            }
          });
        }
      }

      // If Base is already visible on load, render sidebar
      if (basePanel && !basePanel.classList.contains('hidden')) {
        const role = getCurrentUserRole();
        const cfg = getRoleConfig(role);
        sidebarButtonLabels = cfg.labels;
        fragmentMap = cfg.map;
        renderSidebarButtons();
        // if already logged in, show current user name
        try {
          const cu = (window.App && window.App.currentUser) ? window.App.currentUser : null;
          if (cu && currentUserEl) currentUserEl.textContent = cu.name || cu.email || 'User';
          // and set banner default
          if (bannerEl) bannerEl.textContent = 'DASHBOARD';
          // render profile picture on initial load
          try { renderProfilePic(); } catch (e) {}
        } catch (e) {}
      }
    });

