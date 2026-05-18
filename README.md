# whenday

여러 명이 모이는 약속에서 모두가 가능한 날짜를 빠르게 찾아주는 모바일 우선 웹앱.

## 기술 스택

- **프레임워크**: Next.js (App Router, Turbopack)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터 페칭**: TanStack Query v5
- **DB / Auth**: Supabase (Postgres + Auth)
- **날짜 유틸**: date-fns
- **바텀시트**: Vaul
- **배포**: Vercel

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 환경 변수

루트에 `.env.local` 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 문서

전체 기획과 데이터 모델은 [SPEC.md](./SPEC.md) 참고.
