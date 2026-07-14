# coroom - 회의실 예약 시스템 기획서

## 1. 프로덕트 개요

**제품명**: coroom  
**한 줄 설명**: 회의실들의 예약 현황을 한눈에 보고 빈 시간을 눌러 바로 예약할 수 있는 웹사이트  
**개발 플랫폼**: 웹 (반응형 디자인)  
**백엔드**: Supabase  
**타겟 사용자**: 사내 임직원

---

## 2. 문제 정의

- 회의실 예약 현황을 파악하기 어려움
- 예약 프로세스가 복잡하고 시간이 소모됨
- 이미 예약된 시간과 빈 시간을 한눈에 구분하기 어려움
- 회의실 정보(수용인원, 장비, 위치)를 찾기 번거로움

---

## 3. 솔루션

직관적인 캘린더/타임테이블 기반의 예약 시스템으로:
- 모든 회의실의 예약 현황을 시각화
- 한 번의 클릭으로 즉시 예약 가능
- 회의실별 상세 정보 제공
- 빠르고 효율적인 예약 관리

---

## 4. 회의실 정보

| 번호 | 회의실명 | 수용인원 | 층수 | 보유장비 | 특이사항 |
|------|---------|--------|------|--------|--------|
| 1 | 1번 회의실 (소회의실 A) | 4명 | 3층 | TV, 화이트보드 | - |
| 2 | 2번 회의실 (소회의실 B) | 4명 | 3층 | TV, 화이트보드 | - |
| 3 | 3번 회의실 (중회의실 A) | 8명 | 3층 | 빔프로젝터, 화상회의 카메라 | - |
| 4 | 4번 회의실 (중회의실 B) | 8명 | 4층 | 빔프로젝터, 화이트보드 | - |
| 5 | 5번 회의실 (대회의실) | 16명 | 4층 | 빔프로젝터, 화상회의 카메라, 음향장비 | 임원 보고용 우선 배정 |
| 6 | 6번 회의실 (스튜디오) | 6명 | 4층 | 방음시설, 녹화장비 | 면접/촬영 겸용 |

---

## 5. 핵심 기능

### 5.1 대시보드 (메인 페이지)
- **주간 뷰**: 6개 회의실의 일주일 예약 현황을 캘린더/타임테이블 형식으로 표시
- **일일 뷰**: 특정 날짜의 시간별 예약 현황 상세 보기
- **빠른 필터링**: 
  - 수용인원별 필터
  - 보유장비별 필터
  - 층수별 필터

### 5.2 예약 기능
- **원클릭 예약**: 빈 시간대를 클릭하면 예약 폼 팝업
- **예약 정보 입력**:
  - 회의 제목
  - 예약자 이름
  - 예약자 부서
  - 예약자 이메일/전화
  - 참석인원
  - 회의 설명 (선택)

### 5.3 회의실 상세 페이지
- 회의실 정보 (수용인원, 장비, 층수)
- 당일 예약 현황
- 주간 예약 현황
- 회의실 사진 또는 소개

### 5.4 마이 예약
- 사용자가 한 예약 목록
- 예약 수정/취소 기능
- 예약 상세 정보 보기

### 5.5 관리자 기능
- 예약 취소/수정
- 긴급 예약 승인
- 회의실 정보 관리
- 예약 현황 리포트

---

## 6. 데이터 스키마 (Supabase)

### 6.1 회의실 테이블 (rooms)
```sql
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,          -- 회의실명
  description TEXT,                     -- 설명
  capacity INTEGER NOT NULL,            -- 수용인원
  floor VARCHAR(20) NOT NULL,           -- 층수
  equipment TEXT[],                     -- 보유장비 (배열)
  notes TEXT,                           -- 비고
  image_url VARCHAR(500),               -- 회의실 이미지 URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 예약 테이블 (reservations)
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  title VARCHAR(255) NOT NULL,           -- 회의 제목
  reserver_name VARCHAR(100) NOT NULL,  -- 예약자 이름
  reserver_email VARCHAR(100) NOT NULL, -- 예약자 이메일
  reserver_phone VARCHAR(20),            -- 예약자 전화
  reserver_department VARCHAR(100),      -- 예약자 부서
  attendees INTEGER,                     -- 참석인원
  description TEXT,                      -- 회의 설명
  start_time TIMESTAMP NOT NULL,        -- 예약 시작시간
  end_time TIMESTAMP NOT NULL,          -- 예약 종료시간
  status VARCHAR(20) DEFAULT 'approved', -- 상태 (approved, cancelled, pending)
  notes TEXT,                            -- 관리자 메모
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_time CHECK (end_time > start_time)
);

CREATE INDEX idx_room_time ON reservations(room_id, start_time, end_time);
CREATE INDEX idx_reserver_email ON reservations(reserver_email);
```

### 6.3 사용자 테이블 (users) - 선택사항
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',  -- 'user', 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 사용자 시나리오

### 시나리오 1: 빠른 예약
1. 사용자가 coroom 사이트 접속
2. 메인 대시보드에서 모든 회의실의 주간 예약 현황 확인
3. "3번 회의실"의 "오후 2시~3시" 빈 시간 클릭
4. 예약 폼에서 회의 제목, 이름, 이메일 입력
5. "예약하기" 버튼 클릭
6. 예약 완료 메시지 및 확인 이메일 수신

### 시나리오 2: 조건에 맞는 회의실 찾기
1. "필터" 버튼 클릭
2. "수용인원: 8명 이상" 선택
3. "빔프로젝터" 선택
4. 조건에 맞는 회의실(3, 4, 5번)만 표시
5. 4번 회의실의 빈 시간 확인 후 예약

### 시나리오 3: 예약 취소/수정
1. "마이 예약" 페이지 접속
2. 예약 목록에서 해당 예약 선택
3. "수정" 또는 "취소" 클릭
4. 변경사항 저장

---

## 8. 화면 구성

### 8.1 메인 페이지 (대시보드)
- 상단: 네비게이션바 (로고, 메뉴, 사용자 정보)
- 좌측: 필터 패널 (수용인원, 장비, 층수)
- 중앙: 회의실별 주간 일정 표 (시간대 × 회의실)
- 각 셀: 예약 상태 시각화 (예약됨/빈시간/진행중)

### 8.2 회의실 상세 페이지
- 회의실 정보 (사진, 수용인원, 장비, 층수)
- 일일/주간 예약 현황
- 빠른 예약 버튼

### 8.3 예약 폼 (모달)
- 회의 제목
- 예약자 정보 (이름, 부서, 이메일, 전화)
- 예약 시간 (자동 채워짐)
- 참석인원
- 회의 설명
- 예약하기 버튼

### 8.4 마이 예약 페이지
- 예약 목록 (테이블)
- 예약 상세 정보 모달
- 수정/취소 버튼

---

## 9. 기술 스택

| 계층 | 기술 |
|------|------|
| **Frontend** | React / Next.js, TypeScript |
| **UI/UX** | Tailwind CSS, Shadcn/ui 또는 Material-UI |
| **상태관리** | React Query / Zustand |
| **캘린더** | React Big Calendar 또는 FullCalendar |
| **인증** | Supabase Auth |
| **Backend** | Supabase (PostgreSQL, Row Level Security) |
| **호스팅** | Vercel / Netlify |

---

## 10. 보안 및 권한

### 10.1 행 레벨 보안 (Row Level Security)
- 사용자는 자신의 예약만 조회/수정/삭제 가능
- 관리자는 모든 예약 조회/수정/삭제 가능
- 회의실 정보는 전체 공개

### 10.2 예약 충돌 방지
- 같은 시간대의 중복 예약 방지 (데이터베이스 제약)
- 예약 시간 검증 (클라이언트 + 서버)

### 10.3 이메일 인증
- 예약 완료 시 확인 이메일 발송
- 예약 수정/취소 시 알림 이메일 발송

---

## 11. MVP 기능 (1단계)

**우선순위**: 최소 기능 제품으로 시작

### 필수 기능
- [x] 회의실 목록 및 정보 표시
- [x] 주간 예약 현황 캘린더/테이블 뷰
- [x] 한 번의 클릭으로 빠른 예약
- [x] 예약 정보 입력 폼
- [x] 마이 예약 조회 및 취소
- [x] 기본 필터링 (수용인원, 장비)

### 향후 확장 기능
- [ ] 예약 수정 기능
- [ ] 예약 승인 워크플로우
- [ ] 관리자 대시보드
- [ ] 회의실 가용률 통계
- [ ] 반복 예약
- [ ] 캘린더 앱 연동 (Google Calendar, Outlook)
- [ ] 모바일 앱
- [ ] 음성/영상 회의 시스템 연동

---

## 12. 성공 지표

- **사용률**: 월간 활성 사용자 (MAU) 70% 이상
- **예약 시간**: 평균 예약 소요 시간 1분 이내
- **시스템 안정성**: 99.5% 이상 가용성
- **사용자 만족도**: NPS 50 이상
- **예약 충돌률**: 0%

---

## 13. 개발 일정 (예상)

| 단계 | 기간 | 내용 |
|------|------|------|
| 설계 | 1주 | DB 스키마, API 설계, UI 목업 |
| Backend | 2주 | Supabase 테이블 생성, API 구현, RLS 설정 |
| Frontend | 3주 | React 컴포넌트 개발, 상태관리, 통합 |
| 테스트 | 1주 | QA, 버그 수정, 성능 최적화 |
| 배포 | 1주 | 프로덕션 배포, 모니터링 |
| **총 기간** | **8주** | |

---

## 14. 문의 및 피드백

이 기획서는 실제 개발 과정에서 지속적으로 업데이트될 수 있습니다.  
기능 추가, 변경 사항, 또는 피드백이 있으시면 언제든 연락 주세요.
