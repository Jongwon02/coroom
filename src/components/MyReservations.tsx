"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation, Room } from "@/lib/types";
import { formatDateKorean, formatTime } from "@/lib/time";
import { loadIdentity, saveIdentity } from "@/lib/identity";

export default function MyReservations() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [rows, setRows] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Map<number, Room>>(new Map());
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // 회의실 이름 매핑
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("rooms").select("*");
      if (data) {
        const m = new Map<number, Room>();
        (data as Room[]).forEach((r) => m.set(r.id, r));
        setRooms(m);
      }
    })();
  }, []);

  const search = useCallback(async (targetEmail: string) => {
    const e = targetEmail.trim();
    if (!e) return;
    setLoading(true);
    setSearchedEmail(e);
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("reserver_email", e)
      .eq("status", "approved")
      .order("start_time", { ascending: true });
    setRows((data as Reservation[]) ?? []);
    setLoading(false);
  }, []);

  // 저장된 이메일로 자동 조회
  useEffect(() => {
    const id = loadIdentity();
    if (id.email) {
      setEmail(id.email);
      search(id.email);
    }
  }, [search]);

  async function cancel(id: string) {
    if (!window.confirm("이 예약을 취소하시겠습니까?")) return;
    setCancelling(id);
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id);
    setCancelling(null);
    if (error) {
      window.alert(`취소 실패: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const now = new Date();
  const upcoming = rows.filter((r) => new Date(r.end_time) >= now);
  const past = rows.filter((r) => new Date(r.end_time) < now);

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">내 예약</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        예약 시 입력한 이메일로 예약 내역을 확인하고 취소할 수 있어요.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveIdentity({ ...loadIdentity(), email: email.trim() });
          search(email);
        }}
        className="mt-4 flex max-w-md gap-2"
      >
        <input
          type="email"
          className="input"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          조회
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-slate-400">불러오는 중…</p>
      ) : searchedEmail === "" ? (
        <p className="mt-8 text-sm text-slate-400">
          이메일을 입력하고 조회해 주세요.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">
          <span className="font-medium text-slate-600">{searchedEmail}</span> 로 조회된 예약이 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          <Section
            title={`예정된 예약 (${upcoming.length})`}
            rows={upcoming}
            rooms={rooms}
            onCancel={cancel}
            cancelling={cancelling}
            cancellable
          />
          {past.length > 0 && (
            <Section
              title={`지난 예약 (${past.length})`}
              rows={past}
              rooms={rooms}
              onCancel={cancel}
              cancelling={cancelling}
              cancellable={false}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  rooms,
  onCancel,
  cancelling,
  cancellable,
}: {
  title: string;
  rows: Reservation[];
  rooms: Map<number, Room>;
  onCancel: (id: string) => void;
  cancelling: string | null;
  cancellable: boolean;
}) {
  if (rows.length === 0)
    return (
      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-700">{title}</h2>
        <p className="text-sm text-slate-400">없음</p>
      </div>
    );
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-slate-700">{title}</h2>
      <div className="space-y-2">
        {rows.map((r) => {
          const room = rooms.get(r.room_id);
          const start = new Date(r.start_time);
          const end = new Date(r.end_time);
          return (
            <div
              key={r.id}
              className={
                "flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 " +
                (cancellable ? "" : "opacity-60")
              }
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-800">
                  {r.title}
                </div>
                <div className="mt-0.5 text-sm text-slate-500">
                  {room?.name ?? `회의실 ${r.room_id}`} ·{" "}
                  {formatDateKorean(start)} {formatTime(start)}–{formatTime(end)}
                </div>
                {r.description && (
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {r.description}
                  </div>
                )}
              </div>
              {cancellable && (
                <button
                  onClick={() => onCancel(r.id)}
                  disabled={cancelling === r.id}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling === r.id ? "취소 중…" : "취소"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
