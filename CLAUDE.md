@AGENTS.md

# whenday 작업 규칙

## 디자인 시스템 (필수 준수)

색상은 반드시 [src/app/globals.css](src/app/globals.css)에 정의된 디자인 토큰만 사용한다. `text-gray-*`, `bg-gray-*`, `border-gray-*` 같은 raw Tailwind gray 클래스는 금지.

| 용도 | 토큰 |
| --- | --- |
| 본문 텍스트 (가장 진함) | `text-ink-deep` |
| 본문 텍스트 (보통) | `text-ink` |
| 보조 텍스트 | `text-charcoal` / `text-slate` |
| 약한 보조 / 캡션 | `text-steel` / `text-stone` |
| 메인 배경 | `bg-canvas` |
| 약한 면 / 카드 배경 | `bg-surface-soft` |
| 테두리 (강) | `border-hairline` |
| 테두리 (약) | `border-hairline-soft` |
| 상태색 | `success` / `attention` / `warning` / `critical` |
| 브랜드 | `primary` / `primary-deep` (마케팅 표면에서만) |

기타 규칙:
- radius는 토큰만 사용: `rounded-xl`(16) ~ `rounded-4xl`(40). 임의 px 값 자제.
- 1차 액션 버튼은 sticky 푸터 + `rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas`.
- 화면 외피는 **sticky 3단 레이아웃**:
  ```
  <main className="flex h-dvh flex-col bg-canvas">
    <header className="shrink-0 border-b border-hairline-soft bg-canvas"> ... </header>
    <section className="min-h-0 flex-1 overflow-y-auto"> ... </section>
    <footer className="shrink-0 border-t border-hairline-soft bg-canvas"> ... </footer>
  </main>
  ```
- iOS safe-area 푸터: `paddingBottom: "max(env(safe-area-inset-bottom), 16px)"`.
- `h-[100dvh]` 대신 `h-dvh` (린트 canonical).

## Git 작업 흐름

- 새 작업(Phase / feature / 버그픽스) 시작 시 `main`에서 **새 브랜치를 만들고** 작업한다.
  - 브랜치명: `phase-N-<topic>`, `feat/<topic>`, `fix/<topic>` 등.
  - 예: `phase-3-design-polish`, `feat/realtime-sync`.
- `main`에 직접 커밋·푸시 금지. 작업 완료 후 사용자 확인을 받고 머지·푸시.
- 커밋은 사용자가 명시 요청할 때만 생성. 메시지는 영어 conventional commits (`feat:`, `fix:`, `chore:`, `docs:`) 유지.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

## 작업 진행

- 큰 작업(파일 3개+ / 기능 변경)은 plan mode로 계획 → 사용자 승인 후 구현.
- 구현 시 단계별로 변경 내용을 한 줄씩 알리고 진행 (글로벌 CLAUDE.md 규칙).
- 정적 검증 순서: `npx tsc --noEmit` → `npx eslint .` → 필요 시 `npx next build`.
- **`next build`를 dev 서버 떠있는 상태에서 돌리지 않는다.** `.next/`에 prod 산출물(`build/`)과 dev 산출물(`dev/`)이 섞여 라우트 매니페스트 stale 발생. 검증은 dev 서버를 끄고 돌리거나, 검증용 별도 worktree에서.
- UI 변경은 타입체크/빌드만으로 검증 못 함을 명시하고 사용자 수동 테스트 요청.

## Phase 진행 현황

- ✅ Phase 1 — 방장 홈 + Pretendard + 디자인 토큰 + sticky 3단 레이아웃 ([플랜](/Users/jinchoi/.claude/plans/parsed-zooming-toast.md))
- ✅ Phase 2 — 참여자 입장 UX (step machine + 10색 + GSAP overlay + LeaveLink) ([플랜](/Users/jinchoi/.claude/plans/users-jinchoi-claude-plans-parsed-zoomi-idempotent-knuth.md))
- ✅ Phase 3 — 디자인 폴리싱: /new, /result, /confirmed, /login, DatePicker, 캘린더 옛 톤 정비 (69775b9, main 머지·푸시 완료)
- ✅ Phase 3.5 — UI/UX 재배치: 방장 색 선택 (/new), /result 모드 분리(입력/결과 segmented), 결과 모드 상세 시트(vaul Drawer), 헤더 재배치(title 단독 줄 + 메타·액션 줄), 본문 타이포 일괄 업, 캘린더 셀 n/N 제거. 브랜치 `feat/host-color-on-create`, `feat/tap-vs-toggle-split` — PR·머지 대기.
- ⏭ **Phase 4 (다음 회차)** — 데이터 계층: Supabase Realtime, 옵티미스틱 검증, RLS 강화. 새 세션 + plan mode 진입 권장.

## 참고 문서

- 디자인 토큰 정의: [src/app/globals.css](src/app/globals.css)
- 디자인 가이드: [DESIGN.md](DESIGN.md)
- Next.js 가이드: [AGENTS.md](AGENTS.md) (이 버전은 학습 데이터와 다름 — `node_modules/next/dist/docs/` 확인)
- 스키마/RLS: [supabase/schema.sql](supabase/schema.sql)
- 스펙: [SPEC.md](SPEC.md)
