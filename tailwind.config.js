/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./assets/**/*.js",
    "./blog/**/*.html",
    "./build/**/*.html",
    "./scripts/lib/site.mjs"
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0041c8", container: "#0055ff" },
        "on-primary": "#ffffff",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434656",
        surface: "#f7f9fb",
        background: "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        secondary: { DEFAULT: "#565e74", container: "#dae2fd" },
        tertiary: { DEFAULT: "#972500", container: "#c13301" },
        error: { DEFAULT: "#ba1a1a", container: "#ffdad6" },
        outline: { DEFAULT: "#737688", variant: "#c3c5d9" },
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3"
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Space Mono", "JetBrains Mono", "ui-monospace", "monospace"]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem"
      },
      maxWidth: {
        site: "1180px"
      },
      spacing: {
        margin: "32px",
        gutter: "20px"
      }
    }
  },
  plugins: []
};
