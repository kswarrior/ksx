import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider, RequireAuth } from "./lib/auth";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Overview />} />
              <Route
                path="ksx"
                element={
                  <Placeholder
                    icon="sparkles"
                    kicker="Workspace"
                    title="KSX"
                    subtitle="The KSX workspace is coming soon."
                    message="KSX controls, services, and site data will live here in the next iteration."
                  />
                }
              />
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
