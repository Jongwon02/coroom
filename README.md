# 나눠방 · 회의실 예약 시스템

회의실(1~6번)의 예약 현황을 한눈에 보고, **빈 시간을 클릭해 바로 예약**할 수 있는 웹 애플리케이션입니다.
[PRD.md](./PRD.md) 기획서를 기반으로 구현되었습니다.

## 기술 스택

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL + REST) — 프로젝트: `coroom`

## 주요 기능

- 📅 **일자별 예약 보드** — 6개 회의실을 컬럼으로, 09:00~18:00을 30분 단위 슬롯으로 표시
- 🖱️ **원클릭 예약** — 빈 슬롯 클릭 → 예약 폼 모달 → 즉시 예약
- 🔍 **필터** — 수용 인원 / 층 / 보유 장비별 회의실 필터링
- 🚫 **중복 예약 방지** — DB 레벨 `EXCLUDE` 제약으로 같은 시간대 겹침 원천 차단
- 👤 **내 예약** — 이메일로 예약 내역 조회 및 취소 (로그인 없는 MVP, 예약자 정보는 브라우저에 저장)
- ⏱️ 지난 시간대는 자동 비활성화

## 실행 방법

```bash
npm install
npm run dev      # http://localhost:3000 (개발)
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 실행
```

### 환경 변수 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://omznpynrenhfyhkhbuce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

`.env.example`를 참고하세요. (이미 `.env.local`이 구성되어 있습니다.)

## 데이터베이스 구조

| 테이블 | 설명 |
|--------|------|
| `rooms` | 회의실 정보 (id 1~6, 이름, 수용인원, 층, 장비, 비고) |
| `reservations` | 예약 (회의실, 제목, 예약자, 시간, 상태) |

- `reservations.no_overlap`: `EXCLUDE USING gist (room_id, tstzrange(start,end))` — 승인된 예약 간 시간 겹침 방지
- RLS: 조회/생성/수정은 공개(anon), 삭제 정책 없음 → 취소는 `status='cancelled'` 업데이트로 처리

## 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx        # 공통 레이아웃 · 네비게이션
│  ├─ page.tsx          # 예약 현황 (대시보드)
│  └─ my/page.tsx       # 내 예약
├─ components/
│  ├─ Dashboard.tsx     # 일자별 예약 보드
│  ├─ ReservationModal.tsx
│  ├─ RoomFilter.tsx
│  └─ MyReservations.tsx
└─ lib/
   ├─ supabase.ts       # Supabase 클라이언트
   ├─ types.ts          # 타입 정의
   ├─ time.ts           # 슬롯·날짜 유틸
   └─ identity.ts       # 예약자 정보 로컬 저장
```

## 향후 확장 (PRD 참고)

예약 수정, 관리자 대시보드, 반복 예약, 이메일 알림, 캘린더 연동, 로그인(Supabase Auth) 등.
