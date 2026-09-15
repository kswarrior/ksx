import { useEffect, useState } from "react";
import { api, VpsHosting } from "../lib/api";
import "./Vps.css";

export default function VpsHostingPage() {
  const [list, setList] = useState<VpsHosting[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.getVpsHosting().then((r) => setList(r.data));
  }, []);

  const filtered = list.filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="vps-page">
      <header>Free VPS List</header>
      <div className="vps-search">
        <input placeholder="Search VPS" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <main>
        {filtered.map((vps) => (
          <section key={vps.name} className="cards">
            <div className="name">{vps.name}</div>
            <div className="all-info">
              <div className="info">
                RAM: {vps.ram}GB | CPU: {vps.cpu} | Disk: {vps.disk}
              </div>
              <div className="info">
                <span className={vps.renew ? "yes" : "no"}>Renew</span> |{" "}
                <span className={vps.sudo ? "yes" : "no"}>Sudo</span> |{" "}
                <span className={vps.alwaysOn ? "yes" : "no"}>24/7</span>
              </div>
              <div className="info">{vps.location}</div>
            </div>
            <button className="visit" onClick={() => window.open(vps.link, "_blank")}>
              Visit
            </button>
          </section>
        ))}
      </main>
      <footer>© 2025 by KS Warrior</footer>
    </div>
  );
}
