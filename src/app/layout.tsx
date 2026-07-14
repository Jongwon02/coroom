import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "나눠방 · 회의실 예약",
  description: "회의실 예약 현황을 한눈에 보고 빈 시간을 눌러 바로 예약하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                나
              </span>
              <span className="text-lg font-bold tracking-tight">나눠방</span>
              <span className="hidden text-sm text-slate-400 sm:inline">
                회의실 예약
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                예약 현황
              </Link>
              <Link
                href="/my"
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                내 예약
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-slate-400">
          나눠방 · 회의실 1~6번 예약 시스템
        </footer>
      </body>
    </html>
  );
}
