"use client";

import Link from "next/link";
import { useSiteSettings } from "./site-settings-context";
import { BiohostelsMark } from "@/components/biohostels-brand";

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
          <BiohostelsMark size={24} />
        )}
      </span>
      <span>
        {settings.brand.name}
        {label ? <small className={small ? undefined : "brand-tld"}>{label}</small> : null}
      </span>
    </Link>
  );
}
