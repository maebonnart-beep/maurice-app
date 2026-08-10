/**
 * Logo KOTÉ MORIS — emblème poulpe (image détourée fournie par la cliente) + wordmark
 * « Koté / MORIS » en serif. Le poulpe étant teal, le logo s'affiche sur fond clair.
 */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/octopus-emblem.png"
        alt="Koté Moris"
        className="shrink-0 object-contain"
        style={{ height: size, width: "auto" }}
      />
      <span className="flex flex-col leading-none">
        <span className="font-serif font-semibold text-xl tracking-tight text-ink">Koté</span>
        <span className="text-[10px] font-semibold tracking-[0.34em] text-primary -mt-0.5">MORIS</span>
      </span>
    </span>
  );
}
