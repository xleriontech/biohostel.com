"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresca el estado mientras el pago está pendiente (el webhook lo actualiza).
export function StatusRefresher({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 6000);
    return () => window.clearInterval(timer);
  }, [active, router]);
  return null;
}
