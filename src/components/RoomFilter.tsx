"use client";

import { Room } from "@/lib/types";

export interface Filters {
  minCapacity: number; // 0 = 전체
  floor: string; // "all" 또는 층 값
  equipment: string[]; // 선택된 장비를 모두 보유한 회의실만
}

export const DEFAULT_FILTERS: Filters = {
  minCapacity: 0,
  floor: "all",
  equipment: [],
};

const CAPACITY_OPTIONS = [0, 4, 6, 8, 16];

interface Props {
  rooms: Room[];
  filters: Filters;
  onChange: (f: Filters) => void;
  matchCount: number;
}

export default function RoomFilter({ rooms, filters, onChange, matchCount }: Props) {
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort();
  const equipmentOptions = Array.from(
    new Set(rooms.flatMap((r) => r.equipment))
  ).sort();

  const toggleEquipment = (eq: string) => {
    const has = filters.equipment.includes(eq);
    onChange({
      ...filters,
      equipment: has
        ? filters.equipment.filter((e) => e !== eq)
        : [...filters.equipment, eq],
    });
  };

  const isDefault =
    filters.minCapacity === 0 &&
    filters.floor === "all" &&
    filters.equipment.length === 0;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">필터</h2>
        {!isDefault && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            초기화
          </button>
        )}
      </div>

      {/* 수용 인원 */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          수용 인원
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CAPACITY_OPTIONS.map((c) => (
            <Chip
              key={c}
              active={filters.minCapacity === c}
              onClick={() => onChange({ ...filters, minCapacity: c })}
            >
              {c === 0 ? "전체" : `${c}명+`}
            </Chip>
          ))}
        </div>
      </div>

      {/* 층 */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          층
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={filters.floor === "all"}
            onClick={() => onChange({ ...filters, floor: "all" })}
          >
            전체
          </Chip>
          {floors.map((f) => (
            <Chip
              key={f}
              active={filters.floor === f}
              onClick={() => onChange({ ...filters, floor: f })}
            >
              {f}
            </Chip>
          ))}
        </div>
      </div>

      {/* 장비 */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          보유 장비
        </p>
        <div className="flex flex-wrap gap-1.5">
          {equipmentOptions.map((eq) => (
            <Chip
              key={eq}
              active={filters.equipment.includes(eq)}
              onClick={() => toggleEquipment(eq)}
            >
              {eq}
            </Chip>
          ))}
        </div>
      </div>

      <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
        조건에 맞는 회의실 <span className="font-bold text-slate-800">{matchCount}</span>곳
      </p>
    </aside>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-xs font-medium transition " +
        (active
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200")
      }
    >
      {children}
    </button>
  );
}
