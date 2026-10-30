"use client";

import { useTransition } from "react";
import { setUserStatus } from "@/app/actions/admin";

export default function ReviewButtons({ userId, status }: { userId: string; status: string }) {
  const [pending, start] = useTransition();
  const set = (s: "APPROVED" | "REJECTED" | "PENDING") => start(() => setUserStatus(userId, s));
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "APPROVED" && (
        <button type="button" disabled={pending} className="btn-primary h-9 px-3" onClick={() => set("APPROVED")}>
          Rétablir
        </button>
      )}
      {status !== "REJECTED" && (
        <button type="button" disabled={pending} className="btn-danger h-9 px-3" onClick={() => set("REJECTED")}>
          Suspendre
        </button>
      )}
      {status !== "PENDING" && (
        <button type="button" disabled={pending} className="btn-ghost h-9 px-3" onClick={() => set("PENDING")}>
          Mettre en examen
        </button>
      )}
    </div>
  );
}
