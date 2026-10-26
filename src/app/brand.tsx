"use client";

import Link from "next/link";
import { useSiteSettings } from "./site-settings-context";
import { Icon } from "./icons";

export function Brand({ href = "/", small, onClick }: { href?: string; small?: string; onClick?: () => void }) {
  const settings = useSiteSettings();
  const label = small ?? settings.brand.suffix;

  return (
    <Link className="brand" href={href} onClick={onClick}>
      <span className="brand-mark">
        {settings.brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.brand.logoUrl} alt="" />
        ) : (
          <Icon name="logo" size={22} />
        )}
      </span>
      <span>
        {settings.brand.name}
        {label ? <small>{label}</small> : null}
      </span>
    </Link>
  );
}
