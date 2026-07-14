"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Room, Reservation } from "@/lib/types";
import {
  addDays,
  dayRangeISO,
  formatDateKorean,
  formatTime,
  generateDaySlots,
  parseYmd,
  today,
  ymd,
} from "@/lib/time";
import RoomFilter, { Filters, DEFAULT_FILTERS } from "./RoomFilter";
import ReservationModal from "./ReservationModal";

const SLOT_PX = 44;

type Cell =
  | { kind: "free"; slot: Date }
  | { kind: "booked"; reservation: Reservation; span: number };

function buildColumn(slots: Date[], reservations: Reservation[]): Cell[] {
  const cells: Cell[] = [];
  let i = 0;
  while (i < slots.length) {
    const slot = slots[i];
    const r = reservations.find(
      (res) =>
        new Date(res.start_time) <= slot && slot < new Date(res.end_time)
    );
    if (r) {
      let span = 0;
      while (
        i + span < slots.length &&
        new Date(r.start_time) <= slots[i + span] &&
        slots[i + span] < new Date(r.end_time)
      ) {
        span++;
      }
      cells.push({ kind: "booked", reservation: r, span: Math.max(span, 1) });
      i += Math.max(span, 1);
    } else {
      cells.push({ kind: "free", slot });
      i += 1;
    }
  }
  return cells;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => today());
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingRes, setLoadingRes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ room: Room; start: Date } | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // 회의실 로드
  useEffect(() => {
    (async () => {
      setLoadingRooms(true);
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("id");
      if (error) setError(error.message);
      else setRooms(data as Room[]);
      setLoadingRooms(false);
    })();
  }, []);

  // 예약 로드
  const loadReservations = useCallback(async () => {
    setLoadingRes(true);
    const { startISO, endISO } = dayRangeISO(selectedDate);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "approved")
      .gte("start_time", startISO)
      .lt("start_time", endISO)
      .order("start_time");
    if (error) setError(error.message);
    else setReservations(data as Reservation[]);
    setLoadingRes(false);
  }, [selectedDate]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // 현재 시각 갱신 (지난 시간 비활성화용)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const slots = useMemo(() => generateDaySlots(selectedDate), [selectedDate]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (filters.minCapacity && r.capacity < filters.minCapacity) return false;
      if (filters.floor !== "all" && r.floor !== filters.floor) return false;
      if (
        filters.equipment.length > 0 &&
        !filters.equipment.every((eq) => r.equipment.includes(eq))
      )
        return false;
      return true;
    });
  }, [rooms, filters]);

  const reservationsByRoom = useMemo(() => {
    const map = new Map<number, Reservation[]>();
    for (const r of reservations) {
      const list = map.get(r.room_id) ?? [];
      list.push(r);
      map.set(r.room_id, list);
    }
    return map;
  }, [reservations]);

  const isToday = ymd(selectedDate) === ymd(today());

  return (
    <div>
      {/* 상단: 날짜 네비게이션 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">예약 현황</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            빈 시간을 클릭하면 바로 예약할 수 있어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="이전 날"
          >
            ‹
          </button>
          <div className="min-w-[150px] text-center">
            <div className="text-sm font-bold text-slate-800">
              {formatDateKorean(selectedDate)}
            </div>
            <input
              type="date"
              value={ymd(selectedDate)}
              onChange={(e) => e.target.value && setSelectedDate(parseYmd(e.target.value))}
              className="mt-0.5 w-full cursor-pointer bg-transparent text-center text-xs text-slate-400 outline-none"
            />
          </div>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="다음 날"
          >
            ›
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(today())}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              오늘
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          오류: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        {/* 필터 */}
        <div>
          {!loadingRooms && (
            <RoomFilter
              rooms={rooms}
              filters={filters}
              onChange={setFilters}
              matchCount={filteredRooms.length}
            />
          )}
          <Legend />
        </div>

        {/* 보드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          {loadingRooms || loadingRes ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">
              불러오는 중…
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">
              조건에 맞는 회의실이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* 헤더 */}
                <div className="flex border-b border-slate-200">
                  <div className="w-14 shrink-0" />
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex-1 border-l border-slate-100 px-2 pb-2"
                    >
                      <div className="text-sm font-bold text-slate-800">
                        {room.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[10px]">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                          {room.floor}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                          {room.capacity}명
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 본문 */}
                <div className="flex">
                  {/* 시간 축 */}
                  <div className="w-14 shrink-0">
                    {slots.map((s) => (
                      <div
                        key={s.toISOString()}
                        style={{ height: SLOT_PX }}
                        className="relative"
                      >
                        <span className="absolute -top-2 right-2 text-[10px] tabular-nums text-slate-400">
                          {formatTime(s)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 회의실 컬럼 */}
                  {filteredRooms.map((room) => {
                    const roomRes = reservationsByRoom.get(room.id) ?? [];
                    const cells = buildColumn(slots, roomRes);
                    return (
                      <div
                        key={room.id}
                        className="flex-1 border-l border-slate-100"
                      >
                        {cells.map((cell, idx) => {
                          if (cell.kind === "booked") {
                            const r = cell.reservation;
                            return (
                              <div
                                key={`b-${idx}`}
                                style={{ height: cell.span * SLOT_PX }}
                                className="p-0.5"
                              >
                                <div
                                  data-testid="booked"
                                  className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-brand-200 bg-brand-100 px-2 py-1"
                                >
                                  <span className="truncate text-xs font-semibold text-brand-800">
                                    {r.title}
                                  </span>
                                  <span className="truncate text-[10px] text-brand-600">
                                    {formatTime(new Date(r.start_time))}–
                                    {formatTime(new Date(r.end_time))}
                                  </span>
                                  <span className="truncate text-[10px] text-brand-500">
                                    {r.reserver_name}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          const past = cell.slot < now;
                          return (
                            <button
                              key={`f-${idx}`}
                              data-testid="free-slot"
                              disabled={past}
                              onClick={() =>
                                setModal({ room, start: cell.slot })
                              }
                              style={{ height: SLOT_PX }}
                              className={
                                "group block w-full border-t border-slate-100 transition " +
                                (past
                                  ? "cursor-not-allowed bg-slate-50"
                                  : "hover:bg-brand-50 active:bg-brand-100")
                              }
                            >
                              <span className="pointer-events-none flex h-full items-center justify-center text-sm font-medium text-brand-200 transition group-hover:text-brand-600">
                                {past ? "" : "＋"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ReservationModal
          room={modal.room}
          start={modal.start}
          existingForRoom={reservationsByRoom.get(modal.room.id) ?? []}
          onClose={() => setModal(null)}
          onCreated={() => {
            setModal(null);
            loadReservations();
          }}
        />
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded border border-brand-200 bg-brand-100" />
        예약됨
      </div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
        빈 시간 (클릭하여 예약)
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded border border-slate-200 bg-slate-50" />
        지난 시간
      </div>
    </div>
  );
}
