"use client";

import { useState, useTransition } from "react";
import { bookSlot, proposeSlot } from "@/app/actions/booking";
import { ArrowRight, Clock } from "./icons";

import type { DaySlots } from "@/lib/availability";

/**
 * state : free = réservable · taken = la startup a déjà une rencontre à cette heure
 * busy = vous avez déjà une rencontre à cette heure · past = créneau passé
 */
export default function BookingPanel({
  days,
  startupId,
  startupName,
  duration,
  bookingId,
}: {
  days: DaySlots[];
  startupId: string;
  startupName: string;
  duration: number;
  /** Si fourni : on propose un autre horaire pour cette demande au lieu d'en créer une. */
  bookingId?: string;
}) {
  const [active, setActive] = useState(days[0]?.day);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const day = days.find((d) => d.day === active) ?? days[0];
  const selectedSlot = day?.slots.find((s) => s.iso === selected);
  const remaining = day?.slots.filter((s) => s.state === "free").length ?? 0;

  function confirm() {
    if (!selected) return;
    start(async () => {
      const res = bookingId ? await proposeSlot(bookingId, selected) : await bookSlot(startupId, selected);
      if (res.ok) {
        setMessage({ ok: true, text: bookingId ? "Horaire proposé : en attente de réponse." : `Demande envoyée à ${startupName}. Elle devra l’accepter.` });
        setSelected(null);
      } else {
        setMessage({ ok: false, text: res.error ?? "Réservation impossible." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Jours" className="flex border-b border-hairline">
        {days.map((d) => {
          const on = d.day === day?.day;
          return (
            <button
              key={d.day}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => {
                setActive(d.day);
                setSelected(null);
                setMessage(null);
              }}
              className={`label -mb-px flex-1 border-b-2 px-1 py-3 text-[0.625rem] tracking-[0.08em] whitespace-nowrap transition-colors ${
                on ? "border-signal text-signal" : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {d.short}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="label text-[0.6875rem] text-ink-faint">Créneaux disponibles</p>
        <p className="label text-[0.6875rem] text-success">
          {remaining} restant{remaining > 1 ? "s" : ""}
        </p>
      </div>

      <ul className="grid grid-cols-4 gap-2">
        {day?.slots.map((s) => {
          const disabled = s.state !== "free";
          const on = selected === s.iso;
          return (
            <li key={s.iso}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={on}
                onClick={() => {
                  setSelected(s.iso);
                  setMessage(null);
                }}
                title={
                  s.state === "taken"
                    ? "Cette startup est déjà prise à cette heure"
                    : s.state === "busy"
                      ? "Vous avez déjà une rencontre à cette heure"
                      : s.state === "past"
                        ? "Créneau passé"
                        : undefined
                }
                className={`label h-10 w-full rounded-lg border text-[0.8125rem] tracking-wider transition-[background-color,border-color,box-shadow] disabled:cursor-not-allowed disabled:line-through disabled:opacity-30 ${
                  on
                    ? "border-signal bg-signal font-semibold text-night shadow-[0_0_16px_rgba(0,255,255,0.35)]"
                    : "border-hairline bg-surface-2 text-ink hover:border-signal/40 hover:bg-surface-3"
                }`}
              >
                {s.time}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedSlot && (
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-night/60 p-4">
          <Clock className="shrink-0 text-signal" />
          <p className="text-sm">
            <span className="inline-block first-letter:uppercase">{day.label}</span> à <strong className="font-semibold">{selectedSlot.time}</strong>
          </p>
        </div>
      )}

      <button type="button" onClick={confirm} disabled={pending || !selected} className="btn-primary w-full">
        {pending ? "Envoi…" : bookingId ? "Proposer cet horaire" : "Envoyer la demande"}
        {!pending && <ArrowRight width={16} height={16} />}
      </button>
      <p className="label text-center text-[0.6875rem] text-ink-faint">Rencontre de {duration} minutes</p>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.ok ? "border-success/25 bg-success/10 text-success" : "border-destructive/25 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
