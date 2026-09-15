import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Social from "./pages/Social";
import About from "./pages/About";
import MinecraftHosting from "./pages/MinecraftHosting";
import VpsHosting from "./pages/VpsHosting";
import { PterodactylPage, PufferPage, SkyportPage } from "./pages/PanelPages";
import GenericPlaceholder from "./pages/GenericPlaceholder";
import "./styles/global.css";
import "./pages/Panel.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<MapPage />} />
          <Route path="social" element={<Social />} />
          <Route path="about" element={<About />} />

          <Route path="minecraft/hosting/free" element={<MinecraftHosting />} />
          <Route path="vps/hosting/free" element={<VpsHosting />} />
          <Route path="vps/hosting/list/free" element={<VpsHosting />} />

          <Route path="minecraft/make-hosting/pterodactyl" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/pterodactyl.html" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/puffer" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/puffer.html" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/skyport" element={<SkyportPage />} />
          <Route path="minecraft/make-hosting/skyport.html" element={<SkyportPage />} />

          {/* Fallback for other migrated pages */}
          <Route path="minecraft/*" element={<GenericPlaceholder />} />
          <Route path="vps/*" element={<GenericPlaceholder />} />

          <Route path="*" element={<GenericPlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
