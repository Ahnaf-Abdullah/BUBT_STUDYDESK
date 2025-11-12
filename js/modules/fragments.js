// Fragment Module - Handles loading and rendering fragments

export const fragments = {
  // Load fragment HTML
  async loadFragment(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load fragment: ${url}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error loading fragment:", error);
      return `<div class="text-red-500 p-4">Error loading content</div>`;
    }
  },

  // Render fragment in dashboard
  async renderFragment(fragmentUrl, containerId = "dashboard") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="text-center p-8">Loading...</div>';
    const html = await this.loadFragment(fragmentUrl);
    container.innerHTML = html;
  },
};
