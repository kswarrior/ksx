import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import "./styles/global.css";
import "./pages/Panel.css";

// eager only for critical landing
import Dashboard from "./pages/Dashboard";

// lazy for lag-less initial bundle — each page code-splits
const MapPage = lazy(() => import("./pages/MapPage"));
const Social = lazy(() => import("./pages/Social"));
const About = lazy(() => import("./pages/About"));
const MinecraftHosting = lazy(() => import("./pages/MinecraftHosting"));
const VpsHosting = lazy(() => import("./pages/VpsHosting"));
const PanelPages = lazy(() => import("./pages/PanelPages"));
const JavaLauncher = lazy(() => import("./pages/JavaLauncher"));
const JavaDownloader = lazy(() => import("./pages/JavaDownloader"));
const KsClient = lazy(() => import("./pages/KsClient"));
const ServerInfo = lazy(() => import("./pages/ServerInfo"));
const BotPage = lazy(() => import("./pages/BotPage"));
const SetupServer = lazy(() => import("./pages/SetupServer"));
const ServerJarDownloader = lazy(() => import("./pages/ServerJarDownloader"));
const PaidPluginFree = lazy(() => import("./pages/PaidPluginFree"));
const CustomIP = lazy(() => import("./pages/CustomIP"));
const GenericPlaceholder = lazy(() => import("./pages/GenericPlaceholder"));
const NotFound = lazy(() => import("./pages/NotFound"));

// re-export panel pages for lazy wrapper
const PterodactylPage = lazy(() => import("./pages/PanelPages").then(m => ({ default: m.PterodactylPage })));
const PufferPage = lazy(() => import("./pages/PanelPages").then(m => ({ default: m.PufferPage })));
const SkyportPage = lazy(() => import("./pages/PanelPages").then(m => ({ default: m.SkyportPage })));

function PageSpinner() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "50vh", color: "var(--muted)" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.12)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="" element={<Dashboard />} />
            <Route path="map" element={<MapPage />} />
            <Route path="social" element={<Social />} />
            <Route path="about" element={<About />} />

            <Route path="minecraft/hosting/free" element={<MinecraftHosting />} />
            <Route path="minecraft/hosting/free.html" element={<MinecraftHosting />} />
            <Route path="vps/hosting/free" element={<VpsHosting />} />
            <Route path="vps/hosting/list/free" element={<VpsHosting />} />
            <Route path="vps/hosting/list/free.html" element={<VpsHosting />} />

            <Route path="minecraft/make-hosting/pterodactyl" element={<PterodactylPage />} />
            <Route path="minecraft/make-hosting/pterodactyl.html" element={<PterodactylPage />} />
            <Route path="minecraft/make-hosting/puffer" element={<PufferPage />} />
            <Route path="minecraft/make-hosting/puffer.html" element={<PufferPage />} />
            <Route path="minecraft/make-hosting/skyport" element={<SkyportPage />} />
            <Route path="minecraft/make-hosting/skyport.html" element={<SkyportPage />} />

            <Route path="minecraft/java/launcher" element={<JavaLauncher />} />
            <Route path="minecraft/java/launcher.html" element={<JavaLauncher />} />
            <Route path="minecraft/java/downloader" element={<JavaDownloader />} />
            <Route path="minecraft/java/downloader.html" element={<JavaDownloader />} />
            <Route path="minecraft/bedrock/ks-client" element={<KsClient />} />
            <Route path="minecraft/bedrock/ks-client.html" element={<KsClient />} />
            <Route path="minecraft/server/statics" element={<ServerInfo />} />
            <Route path="minecraft/server/statics.html" element={<ServerInfo />} />
            <Route path="minecraft/server/bot" element={<BotPage />} />
            <Route path="minecraft/server/bot.html" element={<BotPage />} />
            <Route path="minecraft/make-server/setup-server-in-vps" element={<SetupServer />} />
            <Route path="minecraft/make-server/setup-server-in-vps.html" element={<SetupServer />} />
            <Route path="minecraft/make-server/server.jar-downloader" element={<ServerJarDownloader />} />
            <Route path="minecraft/make-server/server.jar-downloader.html" element={<ServerJarDownloader />} />
            <Route path="minecraft/make-server/paid-plugin-free" element={<PaidPluginFree />} />
            <Route path="minecraft/make-server/paid-plugin-free.html" element={<PaidPluginFree />} />
            <Route path="minecraft/make-server/custom-ip" element={<CustomIP />} />
            <Route path="minecraft/make-server/custom-ip.html" element={<CustomIP />} />

            {/* Fallback for legacy .html with generic handler */}
            <Route path="minecraft/*" element={<GenericPlaceholder />} />
            <Route path="vps/*" element={<GenericPlaceholder />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
