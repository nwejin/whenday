import Link from "next/link";

const steps = [
  {
    n: 1,
    title: "약속과 참여자 등록",
    desc: "제목, 후보 날짜, 참여자 명단 입력",
  },
  {
    n: 2,
    title: "링크 공유",
    desc: "참여자에게 공유 URL 전달",
  },
  {
    n: 3,
    title: "가능한 날짜 확인",
    desc: "모두가 가능한 날짜를 한눈에",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12">
        <header className="space-y-3 text-center">
          <h1 className="text-5xl font-bold tracking-tight">whenday</h1>
          <p className="text-base leading-relaxed text-gray-600">
            여러 명의 약속을 한 번에
          </p>
        </header>

        <Link
          href="/new"
          className="block w-full rounded-2xl bg-gray-900 px-6 py-4 text-center text-base font-medium text-white transition hover:bg-gray-800 active:bg-gray-700"
        >
          약속 만들기
        </Link>

        <ol className="space-y-3">
          {steps.map(({ n, title, desc }) => (
            <li
              key={n}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {n}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
