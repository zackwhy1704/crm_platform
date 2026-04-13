import type { Config } from "tailwindcss";

/**
 * Design tokens ported from pulse-crm-light.html CSS variables.
 * These map 1:1 to the PulseCRM design system.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f6f7fb",
        surface: "#ffffff",
        surface2: "#f0f2f8",
        surface3: "#e8eaf2",
        border1: "#e2e5ef",
        border2: "#d0d4e4",
        accent: {
          DEFAULT: "#2563eb",
          light: "#eff4ff",
          hover: "#1d4ed8",
        },
        green: {
          DEFAULT: "#16a34a",
          light: "#f0fdf4",
        },
        amber: {
          DEFAULT: "#d97706",
          light: "#fffbeb",
        },
        red: {
          DEFAULT: "#dc2626",
          light: "#fef2f2",
        },
        purple: {
          DEFAULT: "#7c3aed",
          light: "#f5f3ff",
        },
        teal: {
          DEFAULT: "#0d9488",
          light: "#f0fdfa",
        },
        ink: {
          DEFAULT: "#0f172a",
          2: "#475569",
          3: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        xxs: ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        DEFAULT: "0 4px 12px rgba(0,0,0,0.08)",
      },
      spacing: {
        sidebar: "228px",
        topbar: "52px",
      },
    },
  },
  plugins: [],
};

export default config;
