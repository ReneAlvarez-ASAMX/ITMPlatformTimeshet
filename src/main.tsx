import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installRendererLogging } from "./diagnostics";
import "@fontsource/lato/latin-300.css";
import "@fontsource/lato/latin-400.css";
import "@fontsource/lato/latin-700.css";
import "./index.css";

installRendererLogging();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
