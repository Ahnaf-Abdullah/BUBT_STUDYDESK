const API_BASE = "http://localhost:5000/api";

class APIClient {
  constructor() {
    this.token = localStorage.getItem("token");
    this.baseURL = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    return data;
  }

  async register(userData) {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    this.token = data.token;
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    return data;
  }

  // Department methods
  async getDepartments() {
    return await this.request("/departments");
  }

  async addDepartment(name) {
    return await this.request("/departments", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  // Course methods
  async getCourses(departmentId = null) {
    const query = departmentId ? `?departmentId=${departmentId}` : "";
    return await this.request(`/courses${query}`);
  }

  async addCourse(courseData) {
    return await this.request("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  }

  // Material methods
  async getMaterials(courseId = null, status = null) {
    let query = "";
    if (courseId || status) {
      const params = new URLSearchParams();
      if (courseId) params.append("courseId", courseId);
      if (status) params.append("status", status);
      query = `?${params.toString()}`;
    }
    return await this.request(`/materials${query}`);
  }

  async uploadMaterial(formData) {
    // For FormData, don't set Content-Type header (let browser handle it)
    return await this.request("/materials/upload", {
      method: "POST",
      headers: {
        // Remove Content-Type to let browser set multipart boundary
        Authorization: `Bearer ${this.token}`,
      },
      body: formData, // FormData object
    });
  }

  async updateMaterialStatus(materialId, status) {
    return await this.request(`/materials/${materialId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteMaterial(materialId) {
    return await this.request(`/materials/${materialId}`, {
      method: "DELETE",
    });
  }

  // User management methods
  async getUsers() {
    return await this.request("/users");
  }

  async updateUserRole(userId, role) {
    return await this.request(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async updateUserProfile(userId, profileData) {
    return await this.request(`/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });
  }

  // Delete material (mark as denied)
  async deleteMaterial(materialId) {
    return await this.updateMaterialStatus(materialId, "denied");
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
  }
}

// Create global API instance
window.API = new APIClient();
