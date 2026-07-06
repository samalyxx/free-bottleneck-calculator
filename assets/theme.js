/** Shared light/dark toggle for static pages without the calculator app */
(function () {
  const key = "bottleneck-theme";
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem(key);
  applyTheme(saved === "dark" ? "dark" : "light");

  function applyTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    const isDark = next === "dark";
    document.documentElement.setAttribute("data-theme", next);
    if (btn) {
      btn.textContent = isDark ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", String(isDark));
    }
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(key, next);
    });
  }
})();
