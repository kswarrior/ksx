import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const MIN_BOOT_MS = 1500;
const root = ReactDOM.createRoot(document.getElementById("root")!);
const renderApp = () =>
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

const remainingBoot = MIN_BOOT_MS - performance.now();
if (remainingBoot > 0) {
  window.setTimeout(renderApp, remainingBoot);
} else {
  renderApp();
}
