"use client";

import { useState, useTransition } from "react";
import { acceptBooking, cancelBooking, declineBooking, dismissBooking } from "@/app/actions/booking";
import BookingPanel from "./BookingPanel";
import type { DaySlots } from "@/lib/availability";

/**
 * Actions d'une rencontre selon son état :
 * - "respond"  : l'autre partie a proposé un horaire → accepter, refuser ou proposer un autre horaire ;
 * - "waiting"  : j'ai proposé, j'attends la réponse → retirer ma demande ;
 * - "confirmed": rencontre confirmée → annuler.
 */
export default function MeetingActions({
  bookingId,
  mode,
  days,
  startupId,
  startupName,
  duration,
}: {
  bookingId: string;
  mode: "respond" | "waiting" | "confirmed" | "closed";
  days?: DaySlots[];
  startupId?: string;
  startupName?: string;
  duration?: number;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string }>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {mode === "respond" && (
          <>
            <button type="button" disabled={pending} className="btn-primary h-9 px-3" onClick={() => run(() => acceptBooking(bookingId))}>
              Accepter
            </button>
            <button type="button" disabled={pending} className="btn-secondary h-9 px-3" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              Proposer un autre horaire
            </button>
            <button type="button" disabled={pending} className="btn-danger h-9 px-3" onClick={() => run(() => declineBooking(bookingId), "Refuser cette demande ?")}>
              Refuser
            </button>
          </>
        )}
        {mode === "waiting" && (
          <button type="button" disabled={pending} className="btn-danger h-9 px-3" onClick={() => run(() => cancelBooking(bookingId), "Retirer cette demande ?")}>
            Retirer la demande
          </button>
        )}
        {mode === "closed" && (
          <button type="button" disabled={pending} className="btn-ghost h-9 px-3" onClick={() => run(() => dismissBooking(bookingId))}>
            Masquer
          </button>
        )}
        {mode === "confirmed" && (
          <button type="button" disabled={pending} className="btn-danger h-9 px-3" onClick={() => run(() => cancelBooking(bookingId), "Annuler cette rencontre ?")}>
            Annuler
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-13 text-destructive">
          {error}
        </p>
      )}
      {open && mode === "respond" && days && startupId && (
        <div className="w-full rounded-lg border border-hairline bg-night/50 p-4 sm:w-96">
          <BookingPanel days={days} startupId={startupId} startupName={startupName ?? ""} duration={duration ?? 20} bookingId={bookingId} />
        </div>
      )}
    </div>
  );
}
