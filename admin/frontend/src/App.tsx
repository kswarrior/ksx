import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route
            path="github"
            element={
              <Placeholder
                icon="terminal"
                kicker="Integrations"
                title="GitHub"
                subtitle="Repository, Actions, release, and issue automation will live here."
              />
            }
          />
          <Route
            path="cloudflare"
            element={
              <Placeholder
                icon="cloud"
                kicker="Integrations"
                title="Cloudflare"
                subtitle="DNS, Workers, Pages, and account resources will be managed here."
              />
            }
          />
          <Route
            path="jobs"
            element={
              <Placeholder
                icon="zap"
                kicker="Automation"
                title="Background Jobs"
                subtitle="Scheduled and long-running tasks will run on the Go backend."
              />
            }
          />
          <Route
            path="settings"
            element={
              <Placeholder
                icon="sliders"
                kicker="Configuration"
                title="Settings"
                subtitle="GitHub and Cloudflare tokens are read from the server environment."
              />
            }
          />
          <Route
            path="*"
            element={
              <Placeholder
                icon="warning"
                kicker="Not found"
                title="404"
                subtitle="This admin route does not exist yet."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
