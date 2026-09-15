import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, SitemapCategory } from "../lib/api";
import "./MapPage.css";

export default function MapPage() {
  const [data, setData] = useState<SitemapCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSitemap().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="map-loading">Loading map...</div>;

  return (
    <div className="map-page">
      <h1>🌌 Network Map</h1>
      <div className="map">
        {data.map((cat) => (
          <div key={cat.category} className="category">
            <div className="category-title">
              <span dangerouslySetInnerHTML={{ __html: cat.icon }} />
              {cat.category}
            </div>
            {cat.sections.map((sec) => (
              <div key={sec.title} className="section">
                <div className="section-title">{sec.title}</div>
                <div className="pages">
                  {sec.pages.map((p) => (
                    <Link key={p.url} className="page" to={p.url}>
                      <span dangerouslySetInnerHTML={{ __html: p.logo }} />
                      {p.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <footer>KS Warrior • Neural Sitemap</footer>
    </div>
  );
}
