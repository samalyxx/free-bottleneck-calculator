/** Shared dark-mode toggle for static pages without the calculator app */
(function () {
  const key = "bottleneck-theme";
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem(key);
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  if (btn) {
    btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "Light mode" : "Dark mode";
    btn.addEventListener("click", () => {
      const dark = document.documentElement.getAttribute("data-theme") !== "dark";
      document.documentElement.toggleAttribute("data-theme", dark);
      if (dark) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(key, dark ? "dark" : "light");
      btn.textContent = dark ? "Light mode" : "Dark mode";
    });
  }
})();
