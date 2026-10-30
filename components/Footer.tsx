import Image from "next/image";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 text-center sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          <Logo height={40} />
          <Image
            src="/brand/mtdi.png"
            alt="République du Bénin · Ministère de la Transformation Digitale et de l’Innovation"
            width={412}
            height={100}
            className="h-10 w-auto"
          />
        </div>
        <p className="label max-w-2xl text-[0.6875rem] leading-relaxed text-ink-faint">
          République du Bénin · Ministère de la Transformation Digitale et de l’Innovation
        </p>
        <p className="text-13 leading-relaxed text-ink-faint">
          Une initiative du Ministère de la Transformation Digitale et de l’Innovation.
          <br />
          Cotonou, 18-20 novembre 2026 · Benin Digital &amp; Innovation Week.
        </p>
      </div>
    </footer>
  );
}
