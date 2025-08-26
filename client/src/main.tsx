import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Hebrew font support
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap";
document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(<App />);
