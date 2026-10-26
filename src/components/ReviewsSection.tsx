"use client";

import { useEffect, useState } from "react";
import { store } from "@/lib/store";

export interface Review {
  id: string;
  userName: string;
  role: "user" | "admin" | "guest";
  rating: number;
  text: string;
  createdAt: string;
  hostResponse?: {
    text: string;
    at: string;
  };
}

export interface ReviewsSectionProps {
  listingId: string;
}

export function ReviewsSection({ listingId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      setLoading(false);
    }
    loadReviews();
  }, [listingId]);

  if (loading) {
    return <p>Cargando reseñas...</p>;
  }

  if (reviews.length === 0) {
    return <p>Aún no hay reseñas para este alojamiento.</p>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0a2918", marginBottom: 8, fontFamily: "var(--display)" }}>Reseñas de huéspedes</h3>
      {reviews.map((r: Review) => (
        <div key={r.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#15803d" }}>{r.userName}</span>
            <span style={{ background: "#15803d", color: "#fff", padding: "2px 6px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}>{r.rating}</span>
          </div>
          <p style={{ color: "#374151", lineHeight: 1.6, margin: 0 }}>{r.text}</p>
          {r.hostResponse && (
            <div style={{ marginTop: 8, fontSize: "0.875rem", color: "#6b7280" }}>
              Respuesta del anfitrión: {r.hostResponse.text}
            </div>
          )}
          <small style={{ color: "#6b7280" }}>{new Date(r.createdAt).toLocaleDateString("es-CO")}</small>
        </div>
      ))}
    </div>
  );
}