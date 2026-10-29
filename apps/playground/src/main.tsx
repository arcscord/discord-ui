import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "@arcscord/discord-ui/styles.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root)
  throw new Error("Missing app root.");
createRoot(root).render(<StrictMode><App /></StrictMode>);
