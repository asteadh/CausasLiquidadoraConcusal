import { Scale } from "lucide-react";

export function CausasLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"><Scale className="size-5" /></span>
      {!compact && <span className="leading-tight"><span className="block text-sm font-semibold tracking-tight">Causas</span><span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Liquidadora</span></span>}
    </div>
  );
}

export function GoogleMark() {
  return <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.74-.06-1.28-.2-1.84H12v3.48h5.37c-.11.86-.72 2.16-2.08 3.03l-.02.12 3.02 2.29.21.02c1.94-1.75 3.05-4.33 3.05-7.1Z"/><path fill="#34A853" d="M12 21.6c2.63 0 4.84-.85 6.46-2.31l-3.08-2.43c-.82.56-1.92.95-3.38.95a5.86 5.86 0 0 1-5.54-3.97l-.12.01-3.14 2.38-.04.11A9.75 9.75 0 0 0 12 21.6Z"/><path fill="#FBBC05" d="M6.46 13.84A5.77 5.77 0 0 1 6.15 12c0-.64.11-1.25.3-1.84v-.13L3.27 7.62l-.1.05A9.45 9.45 0 0 0 2.25 12c0 1.55.37 3.02.92 4.33l3.29-2.49Z"/><path fill="#EA4335" d="M12 6.19c1.84 0 3.09.78 3.8 1.43l2.78-2.65C16.83 3.42 14.63 2.4 12 2.4a9.75 9.75 0 0 0-8.83 5.27l3.29 2.5A5.86 5.86 0 0 1 12 6.19Z"/></svg>;
}
