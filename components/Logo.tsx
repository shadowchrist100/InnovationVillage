import Image from "next/image";

/** Logo officiel : pictogramme + « Le Village de l’Innovation » (identique au site d'attente). */
export default function Logo({ height = 44 }: { height?: number }) {
  return (
    <span
      className="inline-flex items-center gap-[0.3em] text-ink"
      style={{ height, fontSize: height * 0.3 }}
    >
      <Image src="/brand/mark-on-field.svg" alt="" width={234} height={239} className="h-full w-auto" priority />
      <span
        className="leading-[0.95] font-extrabold tracking-[-0.01em] whitespace-nowrap uppercase"
        style={{ fontFamily: "var(--font-bricolage), ui-sans-serif, system-ui, sans-serif" }}
      >
        Le Village de
        <br />
        l’Innovation
      </span>
    </span>
  );
}
