# 약속잡기 웹앱 - 기획서 (cc 핸드오프용)

## 0. 프로젝트 개요

**한 줄 소개**: 여러 명이 모이는 약속에서 모두가 가능한 날짜를 빠르게 찾아주는 웹앱.

**문제 정의**:
- N명이 모일 때 단톡방이 없으면 한 명씩 일정을 물어봐야 함 (특히 친구의 친구, 친구의 연인까지 끼는 경우)
- 카톡 약속잡기는 시간단위라 부담스럽고, When2meet은 UI가 옛스러움

**MVP 목표 사용자**: 친구 그룹 (예: 커플 3쌍 = 6명) 저녁/주말 약속 잡기

**차별점**:
- 날짜 단위만 (단순함)
- 모바일 우선 UI
- 방장이 참여자 명단을 미리 등록 (스팸/혼란 방지)
- URL 공유로 확정 알림

---

## 1. 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터 페칭 | **TanStack Query (React Query) v5** |
| DB / Auth | Supabase (Postgres + Auth) |
| 배포 | Vercel |
| 패키지 매니저 | pnpm (또는 npm) |

**날짜 라이브러리**: `date-fns` (가벼움, tree-shaking 잘됨)

**TanStack Query를 쓰는 이유**:
- 캐싱 + 자동 리페치로 결과 화면이 항상 최신 상태
- 옵티미스틱 업데이트로 셀 체크 즉시 UI 반영 (체감 속도 ↑)
- Supabase Realtime subscription에서 `queryClient.invalidateQueries()` 호출하면 다른 사람 입력도 자동 반영
- Mutation hooks로 insert/delete 로직 깔끔하게 분리

---

## 2. 사용자 흐름

### 2.1 방장 (Host)
1. 메인 페이지 진입 → "약속 만들기" 버튼
2. **로그인 필요** (Supabase Auth, 이메일/비밀번호. 이메일 인증 비활성화로 즉시 사용)
3. 약속 생성 폼:
   - 약속 제목 (예: "12월 커플 모임")
   - 후보 날짜 범위 (캘린더에서 선택, 또는 시작일~종료일)
   - 참여자 이름 목록 입력 (예: "진, 여친, 친구1, 친구1여친, 친구2, 친구2여친")
4. 생성 완료 → 공유 URL 발급 (`/m/[meetingId]`)
5. 결과 페이지에서 실시간으로 누가 입력했는지, 교집합 날짜 확인
6. 확정 날짜 선택 → "확정 URL 공유" 버튼으로 카톡/문자 공유

### 2.2 참여자 (Participant)
1. 공유 링크 접속
2. 등록된 이름 목록에서 "나는 누구?" 선택
3. **본인 색상 선택** — 6색 팔레트에서 하나 고르기 (이미 다른 사람이 고른 색은 disabled)
4. "입장하기" 버튼 클릭 → 참여자 record의 color 필드 업데이트
5. 캘린더 화면에서 가능한 날짜 클릭/드래그로 선택 (토글)
6. 저장 → 즉시 다른 사람들 선택 결과도 색상 줄로 누적 표시
7. 본인 선택은 언제든 같은 이름으로 다시 들어와서 수정 가능. 색상은 한 번 정한 뒤로 고정 (또는 변경 허용 — v2 결정)

### 2.3 확정 알림
- 방장이 결과 페이지에서 "이 날로 확정" 클릭
- 확정 화면 URL을 카톡 등에 공유
- 참여자가 확정 URL 들어가면 "12월 13일 토요일로 확정되었습니다" 화면

---

## 3. 데이터 모델 (Supabase)

### 3.1 테이블

```sql
-- 약속
create table meetings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date_range_start date not null,
  date_range_end date not null,
  confirmed_date date,           -- 확정되면 채워짐
  created_at timestamptz default now() not null
);

-- 참여자 (방장이 미리 등록한 명단)
create table participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  name text not null,
  color text,                    -- 헥스 색상 코드 (예: '#60A5FA'). 참여자가 입장 시 직접 선택. 입장 전엔 NULL
  display_order int not null,    -- 방장이 등록한 명단 순서
  created_at timestamptz default now() not null,
  unique (meeting_id, name),
  unique (meeting_id, color)     -- 같은 약속 내에서 색상 중복 방지
);

-- 가용 날짜 (참여자가 "가능"으로 선택한 날짜들)
create table availabilities (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade not null,
  available_date date not null,
  created_at timestamptz default now() not null,
  unique (participant_id, available_date)
);

-- 인덱스
create index idx_participants_meeting on participants(meeting_id);
create index idx_availabilities_participant on availabilities(participant_id);
create index idx_availabilities_date on availabilities(available_date);
```

### 3.2 Row Level Security (RLS)

```sql
-- meetings
alter table meetings enable row level security;

-- 누구나 meetings 행 읽기 가능 (링크 가진 사람용) - id로만 접근하므로 OK
create policy "meetings_select_all" on meetings
  for select using (true);

-- 본인 (host)만 생성/수정/삭제
create policy "meetings_insert_own" on meetings
  for insert with check (auth.uid() = host_id);
create policy "meetings_update_own" on meetings
  for update using (auth.uid() = host_id);
create policy "meetings_delete_own" on meetings
  for delete using (auth.uid() = host_id);

-- participants
alter table participants enable row level security;

create policy "participants_select_all" on participants
  for select using (true);

-- 해당 meeting의 host만 참여자 추가/삭제
create policy "participants_insert_host" on participants
  for insert with check (
    exists (select 1 from meetings where id = meeting_id and host_id = auth.uid())
  );
create policy "participants_delete_host" on participants
  for delete using (
    exists (select 1 from meetings where id = meeting_id and host_id = auth.uid())
  );

-- 누구나 participants 업데이트 가능 (참여자가 입장 시 본인 color 선택용)
-- ⚠️ 클라이언트에서 color 외 필드는 변경하지 않도록 주의 (name, display_order는 그대로 보내기)
-- 더 엄격하게 하려면 컬럼 단위 권한 제어가 필요한데, MVP는 친구끼리 신뢰 가정
create policy "participants_update_all" on participants
  for update using (true);

-- availabilities
alter table availabilities enable row level security;

create policy "availabilities_select_all" on availabilities
  for select using (true);

-- 누구나 insert/delete 가능 (참여자 이름 선택 기반, 익명)
-- ⚠️ 보안 트레이드오프: 친구끼리 신뢰 가정.
-- 필요시 나중에 participant_id 기반 간단 토큰 추가
create policy "availabilities_insert_all" on availabilities
  for insert with check (true);
create policy "availabilities_delete_all" on availabilities
  for delete using (true);
```

---

## 4. 페이지 구조 (App Router)

```
app/
├── page.tsx                      # 랜딩 (소개 + "약속 만들기")
├── login/page.tsx                # 로그인 + 가입 (이메일/비번, 단일 페이지 토글)
├── new/page.tsx                  # 약속 생성 폼 (auth 필요)
├── m/[meetingId]/
│   ├── page.tsx                  # 참여자 진입 화면 (이름 선택 → 입력)
│   ├── select/page.tsx           # 가능 날짜 선택 화면
│   └── result/page.tsx           # 결과/교집합 화면 (방장+참여자 공용)
├── m/[meetingId]/confirmed/page.tsx  # 확정 화면 (공유용)
└── api/                          # Route Handlers (필요시)
```

**`m/`는 "meeting"의 줄임** — URL 짧게 가져가는 게 카톡 공유 시 가독성 좋음.

---

## 5. 핵심 UI 컴포넌트

### 5.1 캘린더 그리드 (구글 캘린더 스타일)

**디자인 방향**:
- 미니멀, 충분한 여백, 깔끔한 산세리프 폰트 (`-apple-system, "Pretendard", sans-serif` 추천 — 한글 가독성)
- 월 단위 그리드 (7열 × 5~6행), 셀 간 1px hairline 구분
- 헤더: 월/년 + 이전·다음 달 네비게이션 (`←` / `→`)
- 요일 라벨: 일·월·화·수·목·금·토 (통일된 톤, 빨강/파랑 X)
- 오늘 날짜: 작은 동그란 배경
- 후보 범위 밖 날짜: 흐리게 + disabled

### 5.2 셀 안 시각화 — **수평 스트라이프 누적**

각 셀은 위에서 아래로 영역이 분할됨:

```
┌─────────────┐
│ 15      ⭐  │  ← 상단: 날짜 (오른쪽에 모두 가능 시 아이콘)
├─────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓ │  ← 참여자 1 (자기 색, 해당 날짜 가능)
│ ▓▓▓▓▓▓▓▓▓▓▓ │  ← 참여자 2
│             │  ← 참여자 3 (이 날 불가능 → 빈 줄)
│ ▓▓▓▓▓▓▓▓▓▓▓ │  ← 참여자 4
│ ▓▓▓▓▓▓▓▓▓▓▓ │  ← 참여자 5
│ ▓▓▓▓▓▓▓▓▓▓▓ │  ← 참여자 6
└─────────────┘
```

**핵심 규칙**:
- 참여자 슬롯은 항상 N개 (등록된 참여자 수만큼). 빠진 사람은 **빈 줄**이 자리를 차지함 → 누가 빠졌는지 시각적으로 즉시 보임
- 슬롯 순서는 `display_order` (방장 등록 순서) 고정. 어느 셀에서나 같은 위치에 같은 사람이 옴 → 칼럼처럼 읽힘
- 각 스트라이프 높이는 셀 높이를 N등분 (참여자 수에 따라 자동 계산). 모바일에선 최소 4px 보장

**전원 가능 vs 부분 가능 vs 그 외**:
- **전원 가능 셀**: 모든 스트라이프 채워짐 + 셀 우상단에 ⭐/✓ 아이콘 + 셀 테두리 살짝 강조
- **부분 가능 셀**: 일부 스트라이프 채워짐 + 빈 줄은 옅은 회색
- **아무도 선택 안 한 셀**: 전체 옅은 회색 처리 (시선이 색칠된 셀로 가도록)
- **후보 범위 외 셀**: 더 흐리게 + 인터랙션 비활성

### 5.3 셀 상호작용

**선택 모드** (참여자 본인이 가능 날짜 고르는 화면):
- 본인 슬롯에만 색칠/지우기. 다른 사람 슬롯은 readonly
- 셀 어디든 탭하면 본인 슬롯 토글
- 드래그 멀티선택: touchstart → touchmove → 시작셀~현재셀 토글 (첫 셀 상태 기준으로 일괄 채우기/지우기)
- 본인 슬롯은 진한 색, 다른 사람 슬롯은 살짝 흐리게 표시 (자기 입력에 집중)

**결과 모드** (확정 전 모두 입력 확인 / 방장 화면):
- 모든 슬롯 표시
- **셀 탭 → 상세 정보 패널** 노출 (필수 기능):
  - 모바일: 하단 바텀시트 (Vaul)
  - 데스크탑: 셀 옆 팝오버
- 패널에 표시할 내용:
  - 상단: 날짜 (예: "12월 13일 토요일") + 카운트 (예: "6/6 모두 가능 ⭐" 또는 "4/6 가능")
  - **가능한 사람 섹션**: 각 참여자의 색상 칩 + 이름 (스트라이프 순서와 동일)
  - **불가능한 사람 섹션**: 회색 + 이름 (취소선 또는 흐리게)
  - 미입력자(아직 안 들어온 사람)는 별도로 "미입력: 친구2" 같이 구분 표시
  - 방장에게만 보이는 액션: "이 날로 확정하기" 버튼 (전원 가능 셀일 때 강조)
- 전원 가능 셀은 시각적으로 두드러지게 (배경 + 별 아이콘)

### 5.4 참여자 입장 화면 (이름 + 색상 선택)

**플로우**:
1. 등록된 이름 목록에서 본인 이름 클릭
2. 그 아래 색상 팔레트 노출 — "색을 선택해주세요"
3. 색 선택 → "입장하기" 버튼 활성화
4. 입장하기 클릭 → DB에 색상 저장 + select 화면으로 이동

**색상 선택 UI**:
- 6개 색상 칩 가로 배열, 큰 원형 버튼 (최소 56×56px)
- 이미 다른 참여자가 고른 색은 disabled (회색 + ✗ 표시) + tooltip "다른 참여자가 이미 선택"
- 선택한 색은 진하게 + 체크 아이콘
- 미선택 시 "입장하기" 버튼 disabled

### 5.5 참여자별 색상 팔레트

**6개 색상 (구글 캘린더/Notion 톤의 뮤트 컬러)**:

```ts
export const PARTICIPANT_COLORS = [
  { name: 'rose',    hex: '#F87171' },
  { name: 'orange',  hex: '#FB923C' },
  { name: 'amber',   hex: '#FBBF24' },
  { name: 'emerald', hex: '#34D399' },
  { name: 'sky',     hex: '#60A5FA' },
  { name: 'violet',  hex: '#A78BFA' },
] as const;
// 7명 이상이면 indigo/pink/teal 추가
```

- DB `participants.color`에 hex로 저장 (참여자가 입장 시 선택)
- 색상 선택 시 "이미 사용 중인 색"은 다른 participants 레코드의 color 값을 조회해서 판단

### 5.6 참여자 목록 사이드바 (결과 화면)
- 각 참여자 옆에 본인 색상 칩 + 이름 + 입력 여부 (✓ / 미입력 / 색상 미선택)
- 캘린더 셀의 스트라이프 순서와 일치 → "위에서 두 번째 줄은 누구"가 자연스럽게 매칭됨
- 미입력자 옆에 "리마인드 링크 복사" 버튼 (선택사항)
- 모바일에선 캘린더 위 가로 스크롤 칩

### 5.7 모바일 최적화 포인트
- 캘린더 셀 최소 터치 영역 44×44px
- 가로 스크롤 없음 (월 단위 페이지네이션, 좌우 스와이프 지원)
- 하단 고정 버튼 (저장, 공유) — `safe-area-inset-bottom` 처리
- 셀 탭 시 바텀시트 = Vaul 라이브러리 추천 (`npm i vaul`)

---

## 5.A TanStack Query 사용 패턴

**Query Keys 구조**:
```ts
const meetingKeys = {
  all: ['meetings'] as const,
  detail: (id: string) => [...meetingKeys.all, id] as const,
  participants: (id: string) => [...meetingKeys.detail(id), 'participants'] as const,
  availabilities: (id: string) => [...meetingKeys.detail(id), 'availabilities'] as const,
};
```

**주요 Hooks**:
- `useMeeting(meetingId)` — 약속 정보
- `useParticipants(meetingId)` — 참여자 목록 (색상 포함)
- `useAvailabilities(meetingId)` — 모든 가용 날짜 (실시간 구독 대상)
- `useToggleAvailability()` — 가용 날짜 토글 mutation (옵티미스틱 업데이트)
- `usePickColor()` — 참여자 색상 선택 mutation

**옵티미스틱 업데이트 패턴** (셀 토글):
```ts
useMutation({
  mutationFn: toggleAvailability,
  onMutate: async (vars) => {
    await queryClient.cancelQueries({ queryKey: meetingKeys.availabilities(meetingId) });
    const prev = queryClient.getQueryData(meetingKeys.availabilities(meetingId));
    queryClient.setQueryData(meetingKeys.availabilities(meetingId), (old) => /* 토글 */);
    return { prev };
  },
  onError: (err, vars, ctx) => {
    queryClient.setQueryData(meetingKeys.availabilities(meetingId), ctx?.prev);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: meetingKeys.availabilities(meetingId) });
  },
});
```

**Supabase Realtime 연동** (선택사항, MVP 후반):
```ts
useEffect(() => {
  const channel = supabase
    .channel(`meeting:${meetingId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'availabilities' },
      () => queryClient.invalidateQueries({ queryKey: meetingKeys.availabilities(meetingId) })
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [meetingId]);
```

---

## 6. 핵심 로직

### 6.1 교집합 계산
```ts
// availabilities를 date별로 묶고 카운트
// 전체 참여자 수와 일치하는 날짜 = "모두 가능"
type DateCount = { date: string; count: number; participantIds: string[] };

function getIntersection(
  availabilities: Availability[],
  totalParticipants: number
): { allAvailable: DateCount[]; partial: DateCount[] } {
  // ...
}
```

### 6.2 실시간 업데이트 (선택사항)
- Supabase Realtime으로 `availabilities` 테이블 구독
- 다른 참여자가 입력하면 결과 화면 자동 갱신
- MVP에서는 일단 페이지 새로고침 or 5초 polling으로 시작해도 OK

---

## 7. MVP 범위 (포함/제외)

### ✅ 포함
- 방장 이메일/비번 가입·로그인 (이메일 verify OFF)
- 약속 생성 (제목, 날짜 범위, 참여자 명단)
- 공유 URL
- 참여자 이름 선택 + **본인 색상 선택**
- 캘린더 그리드 (구글 캘린더 스타일, 수평 스트라이프 누적 시각화)
- 가능 날짜 선택 (드래그 멀티선택)
- 결과 화면 (교집합 + 색상 스트라이프 누적)
- TanStack Query로 데이터 페칭 + 옵티미스틱 업데이트
- 확정 날짜 + 확정 URL 공유
- 모바일 최적화

### ❌ 제외 (v2 이후)
- 시간 단위 선택
- 코멘트/메모
- 다크모드
- 이메일/카톡 봇 알림 (URL 공유로 대체)
- 비밀번호/토큰 기반 본인 수정 보호
- 다국어
- Supabase Realtime (필요하면 MVP 후반 추가)

---

## 8. Supabase 프로젝트 설정 메모

- 현재 활성 프로젝트 1개 + 일시정지 1개 (nwejin's Project, 2026-07-31까지 재개 가능)
- 무료 슬롯 1개 여유 → 약속잡기 프로젝트 새로 생성 OK
- 리전: Northeast Asia (Seoul) 추천
- 7월 31일 전에 nwejin's Project 다시 살리고 싶어지면 그 때 슬롯 정리
- Authentication → Providers → Email → "Confirm email" 토글 OFF (이메일 인증 없이 즉시 로그인)

---

## 9. 작업 순서 제안 (cc에게)

1. Next.js + Tailwind + TS 프로젝트 init
2. Supabase 프로젝트 생성 + 위 SQL 적용 + RLS 정책 적용
3. Supabase 클라이언트 (browser/server) 설정 + 환경변수
4. **TanStack Query 셋업** (`@tanstack/react-query` 설치, `QueryClientProvider` 루트에 래핑, devtools)
5. 이메일/비번 가입·로그인 페이지 + 보호 라우트 (`/new`만 auth 필요)
6. 랜딩 + 로그인 페이지
7. 약속 생성 폼 (`/new`)
8. **참여자 진입 화면** (`/m/[id]`) — 이름 선택 → 색상 선택 → 입장
9. **캘린더 컴포넌트** (가장 큰 작업, 따로 빼서 작업)
   - 9-1. 정적 그리드 렌더링 (월 네비, 후보 범위 disabled)
   - 9-2. 셀 안 스트라이프 레이아웃 (참여자 슬롯 N등분)
   - 9-3. 셀 클릭/탭 토글 (선택 모드)
   - 9-4. 드래그 멀티선택
   - 9-5. **셀 탭 상세 패널** (결과 모드) — 바텀시트/팝오버에 가능자·불가능자·미입력자 표시
10. 가능 날짜 선택 화면 (`/m/[id]/select`) — 캘린더 + 본인 모드
11. 결과 화면 (`/m/[id]/result`) — 캘린더 + 전체 모드 + 셀 탭 바텀시트
12. 확정 화면 (`/m/[id]/confirmed`)
13. 모바일 폴리싱 + 실기기 테스트
14. Vercel 배포

---

## 10. 열린 질문 (나중에 결정)

- 결과 화면을 방장과 참여자가 동일 URL에서 보는데, 방장 전용 액션(확정, 참여자 추가)은 어떻게 노출? → Supabase `getUser()`로 host 여부 판단 후 UI 분기
- 참여자가 자기 선택을 수정할 때, 같은 이름으로 다시 들어오면 기존 선택을 불러와 보여주는 게 자연스러움. 색상도 이미 정해져 있으면 색상 선택 단계 스킵
- 약속 URL에 짧은 슬러그(예: `m/abc12`) vs UUID 전체 → 보안상 UUID가 안전 (추측 불가). MVP는 UUID로 가고, 필요시 단축 추가
- 참여자가 7명 이상이면 스트라이프가 너무 얇아져서 가독성 떨어짐 → MVP 기준 최대 8명까지 제한 두는 게 안전. 폼에서 validation
- 참여자가 본인 식별을 다른 사람으로 잘못 골라서 색상 가져가버리면 곤란 → 입장 직후 "X님이 맞나요?" 한 번 확인 (선택 사항)
