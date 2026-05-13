import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../SahityotsavResults.jsx";

if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const v = localStorage.getItem(key);
        return v ? { value: v } : null;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
