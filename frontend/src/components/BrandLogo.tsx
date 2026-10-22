import { useEffect, useState } from "react";
import Icon, { type IconName } from "./Icon";
import "./BrandLogo.css";

type BrandLogoProps = {
  src?: string;
  fallback: IconName;
  className?: string;
  iconSize?: number;
};

export default function BrandLogo({ src, fallback, className = "", iconSize = 22 }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <span className={`brand-logo ${className}`.trim()} aria-hidden="true">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon name={fallback} size={iconSize} />
      )}
    </span>
  );
}
