import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Simple initialization - SQLite will be handled at service level with fallback
createRoot(document.getElementById("root")!).render(<App />);
