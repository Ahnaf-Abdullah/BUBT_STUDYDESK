// Lightweight shared mock data for the static frontend demo
(function () {
  const STORAGE_KEY = "bubt_demo_app_v1";

  const seed = {
    users: [
      {
        id: 1,
        name: "Student",
        email: "student@bubt.edu",
        password: "student123",
        role: "student",
        department: "Computer Science",
        studentId: "22235103550",
        gender: "female",
        section: 1,
        profilePic: "",
      },
      {
        id: 2,
        name: "Mod",
        email: "mod@bubt.edu",
        password: "mod123",
        role: "moderator",
        department: "Computer Science",
        studentId: "22235103204",
        gender: "male",
        section: 1,
        profilePic: "",
      },
      {
        id: 3,
        name: "Admin",
        email: "Admin@bubt.edu",
        password: "Admin123",
        role: "admin",
        department: "Computer Science",
        studentId: "22235103206",
        gender: "female",
        section: 3,
        profilePic: "",
      },
    ],
    departments: [
      { id: 1, name: "Computer Science" },
      { id: 2, name: "Electrical Engineering" },
    ],
    courses: [
      { id: 1, departmentId: 1, name: "CSE 321", code: "CSE321" },
      { id: 2, departmentId: 1, name: "CSE 322", code: "CSE322" },
      { id: 3, departmentId: 2, name: "EEE 101", code: "EEE101" },
    ],
    materials: [
      {
        id: 1,
        title: "Data Structures Notes",
        courseCode: "CSE321",
        uploader: "Student",
        status: "pending",
      },
      {
        id: 2,
        title: "Circuits PDF",
        courseCode: "EEE101",
        uploader: "Student",
        status: "approved",
      },
      {
        id: 3,
        title: "Algorithms Slides",
        courseCode: "CSE322",
        uploader: "Student",
        status: "pending",
      },
    ],
    currentUserEmail: null,
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(seed));
      return JSON.parse(raw);
    } catch (e) {
      console.warn("mockdata load error", e);
      return JSON.parse(JSON.stringify(seed));
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("mockdata save error", e);
    }
  }

  const state = load();

  window.App = {
    // data
    get users() {
      return state.users;
    },
    get departments() {
      return state.departments;
    },
    get courses() {
      return state.courses;
    },
    get materials() {
      return state.materials;
    },
    get currentUser() {
      return (
        state.users.find((u) => u.email === state.currentUserEmail) || null
      );
    },

    // simple operations

    // login with email and password (demo)
    login(email, password) {
      const e = (email || "").trim().toLowerCase();
      const p = password || "";
      // demo: compare password case-insensitively to reduce friction
      const user = state.users.find(
        (u) => u.email === e && String(u.password || "") === String(p)
      );
      if (user) {
        state.currentUserEmail = user.email;
        save(state);
        return user;
      }
      // helpful debug: show available accounts in console (demo only)
      try {
        console.warn(
          "Login failed for",
          e,
          "available demo accounts:",
          state.users.map((u) => u.email)
        );
      } catch (err) {}
      return null;
    },

    logout() {
      state.currentUserEmail = null;
      save(state);
    },

    // register requires name, email and password in this demo
    register(userData) {
      const id = (state.users[state.users.length - 1]?.id || 0) + 1;
      const email = (userData.email || "").trim().toLowerCase();
      const u = {
        id,
        name: userData.name || email,
        email,
        password: userData.password || "",
        role: "student",
        department: userData.department || "",
        intake: userData.intake || "",
        studentId: userData.studentId || "",
        gender: userData.gender || "",
        profilePic: userData.profilePic || "",
      };
      state.users.push(u);
      state.currentUserEmail = u.email;
      save(state);
      return u;
    },

    addDepartment(name) {
      const id = (state.departments[state.departments.length - 1]?.id || 0) + 1;
      const d = { id, name };
      state.departments.push(d);
      save(state);
      return d;
    },

    addCourse(departmentId, name, code) {
      const id = (state.courses[state.courses.length - 1]?.id || 0) + 1;
      const c = { id, departmentId: Number(departmentId), name, code };
      state.courses.push(c);
      save(state);
      return c;
    },

    changeMaterialStatus(id, status) {
      const m = state.materials.find((x) => x.id === id);
      if (!m) return null;
      m.status = status;
      save(state);
      return m;
    },

    updateUserRole(id, role) {
      const u = state.users.find((x) => x.id === id);
      if (!u) return null;
      u.role = role;
      save(state);
      return u;
    },

    addMaterial(title, courseCode, uploader) {
      const id = (state.materials[state.materials.length - 1]?.id || 0) + 1;
      const m = {
        id,
        title,
        courseCode,
        uploader: uploader || this.currentUser?.name || "guest",
        status: "pending",
      };
      state.materials.push(m);
      save(state);
      return m;
    },

    // reset persisted state back to the original seed (demo helper)
    resetToSeed() {
      try {
        // clear current state object and copy seed into it
        Object.keys(state).forEach((k) => delete state[k]);
        const fresh = JSON.parse(JSON.stringify(seed));
        Object.assign(state, fresh);
        save(state);
        return state;
      } catch (e) {
        console.warn("resetToSeed failed", e);
        return null;
      }
    },
  };

  // expose for quick console debugging
  window.__APP_STATE = state;
  window.App.init();
})();
