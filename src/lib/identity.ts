// 로그인이 없는 MVP: 예약자 정보를 브라우저에 저장해 재사용한다.
const KEY = "coroom.identity";

export interface Identity {
  name: string;
  email: string;
  department: string;
}

export function loadIdentity(): Identity {
  if (typeof window === "undefined") return { name: "", email: "", department: "" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { name: "", email: "", department: "" };
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name ?? "",
      email: parsed.email ?? "",
      department: parsed.department ?? "",
    };
  } catch {
    return { name: "", email: "", department: "" };
  }
}

export function saveIdentity(id: Identity): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(id));
}
