"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Room, Reservation } from "@/lib/types";
import {
  DAY_END_HOUR,
  SLOT_MINUTES,
  addMinutes,
  formatTime,
} from "@/lib/time";
import { loadIdentity, saveIdentity } from "@/lib/identity";

interface Props {
  room: Room;
  start: Date;
  /** 해당 회의실의 그날 승인된 예약들 (종료시간 상한 계산용) */
  existingForRoom: Reservation[];
  onClose: () => void;
  onCreated: () => void;
}

export default function ReservationModal({
  room,
  start,
  existingForRoom,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [attendees, setAttendees] = useState("");
  const [description, setDescription] = useState("");
  const [endISO, setEndISO] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 저장된 예약자 정보 불러오기
  useEffect(() => {
    const id = loadIdentity();
    setName(id.name);
    setEmail(id.email);
    setDepartment(id.department);
  }, []);

  // 선택 가능한 종료 시각: start 이후 슬롯 경계들, 단 다음 예약 시작 전까지 & 18:00까지
  const endOptions = useMemo(() => {
    const dayEnd = new Date(start);
    dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

    // start 이후에 시작하는 가장 이른 기존 예약
    const nextBookingStart = existingForRoom
      .map((r) => new Date(r.start_time))
      .filter((d) => d > start)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const cap = nextBookingStart && nextBookingStart < dayEnd ? nextBookingStart : dayEnd;

    const opts: Date[] = [];
    let cur = addMinutes(start, SLOT_MINUTES);
    while (cur.getTime() <= cap.getTime()) {
      opts.push(new Date(cur));
      cur = addMinutes(cur, SLOT_MINUTES);
    }
    return opts;
  }, [start, existingForRoom]);

  useEffect(() => {
    if (endOptions.length > 0) setEndISO(endOptions[0].toISOString());
  }, [endOptions]);

  const capacityWarn =
    attendees !== "" && Number(attendees) > room.capacity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("회의 제목을 입력해 주세요.");
    if (!name.trim()) return setError("예약자 이름을 입력해 주세요.");
    if (!email.trim()) return setError("예약자 이메일을 입력해 주세요.");
    if (!endISO) return setError("종료 시간을 선택해 주세요.");

    setSubmitting(true);
    saveIdentity({ name: name.trim(), email: email.trim(), department: department.trim() });

    const { error: insertError } = await supabase.from("reservations").insert({
      room_id: room.id,
      title: title.trim(),
      reserver_name: name.trim(),
      reserver_email: email.trim(),
      reserver_department: department.trim() || null,
      attendees: attendees === "" ? null : Number(attendees),
      description: description.trim() || null,
      start_time: start.toISOString(),
      end_time: endISO,
    });

    setSubmitting(false);

    if (insertError) {
      // 시간 겹침 (exclusion constraint) 처리
      if (
        insertError.code === "23P01" ||
        insertError.message.toLowerCase().includes("no_overlap") ||
        insertError.message.toLowerCase().includes("exclusion")
      ) {
        setError("이미 예약된 시간과 겹칩니다. 다른 시간을 선택해 주세요.");
      } else {
        setError(`예약에 실패했습니다: ${insertError.message}`);
      }
      return;
    }

    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">회의실 예약</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {room.name} · {room.floor} · 최대 {room.capacity}명
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <span className="font-semibold">시작</span> {formatTime(start)}
          {endOptions.length === 0 && (
            <span className="ml-2 text-red-600">· 예약 가능한 시간이 없습니다</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="회의 제목" required>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 주간 팀 회의"
              autoFocus
            />
          </Field>

          <Field label="종료 시간" required>
            <select
              className="input"
              value={endISO}
              onChange={(e) => setEndISO(e.target.value)}
              disabled={endOptions.length === 0}
            >
              {endOptions.map((d) => (
                <option key={d.toISOString()} value={d.toISOString()}>
                  {formatTime(d)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="예약자 이름" required>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </Field>
            <Field label="부서">
              <input
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예) 개발팀"
              />
            </Field>
          </div>

          <Field label="이메일" required>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Field label={`참석 인원 (최대 ${room.capacity}명)`}>
            <input
              type="number"
              min={1}
              className="input"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="선택 사항"
            />
            {capacityWarn && (
              <p className="mt-1 text-xs text-amber-600">
                수용 인원({room.capacity}명)을 초과합니다.
              </p>
            )}
          </Field>

          <Field label="회의 설명">
            <textarea
              className="input min-h-[72px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="선택 사항"
            />
          </Field>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || endOptions.length === 0}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "예약 중…" : "예약하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
