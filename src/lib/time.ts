// 운영 시간 및 슬롯 설정
export const DAY_START_HOUR = 9; // 09:00
export const DAY_END_HOUR = 18; // 18:00 (마지막 슬롯 종료)
export const SLOT_MINUTES = 30;

const pad = (n: number) => n.toString().padStart(2, "0");

/** Date -> 'YYYY-MM-DD' (로컬 기준) */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' -> 해당 날짜의 로컬 자정 Date */
export function parseYmd(s: string): Date {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

/** 오늘 로컬 자정 */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** 'HH:MM' */
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '7월 14일 (월)' 형태 */
export function formatDateKorean(d: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

/** 특정 날짜의 슬롯 시작 시각들 (로컬 Date 배열) */
export function generateDaySlots(day: Date): Date[] {
  const slots: Date[] = [];
  const totalSlots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  for (let i = 0; i < totalSlots; i++) {
    const start = new Date(day);
    start.setHours(DAY_START_HOUR, 0, 0, 0);
    slots.push(addMinutes(start, i * SLOT_MINUTES));
  }
  return slots;
}

/** 하루 조회용 ISO 범위 [00:00, 다음날 00:00) */
export function dayRangeISO(day: Date): { startISO: string; endISO: string } {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** 두 구간 [aStart,aEnd) 와 [bStart,bEnd) 가 겹치는지 */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
