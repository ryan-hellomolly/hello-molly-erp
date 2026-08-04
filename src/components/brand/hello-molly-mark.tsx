export function HelloMollyMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center" aria-label="Hello Molly ERP">
      <span className="relative font-black tracking-[0.12em] text-slate-950">
        {compact ? "HM" : "HELLO MOLLY"}
        <svg
          aria-hidden="true"
          viewBox="0 0 30 18"
          className={`absolute -top-3.5 fill-none stroke-pink-500 stroke-[2.2] ${compact ? "left-3 size-4" : "left-[3.15rem] h-4 w-6"}`}
        >
          <path d="m3 14 2-9 6 5 4-8 4 8 6-5 2 9Z" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="ml-2 border-l border-pink-200 pl-2 text-xs font-bold tracking-[0.18em] text-pink-600">
          ERP
        </span>
      )}
    </span>
  );
}
