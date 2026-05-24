-- whenday: 초기 스키마 + 인덱스 + RLS
-- Supabase SQL Editor에 통째로 붙여넣고 Run
-- 중간 에러 시 전체 롤백되도록 트랜잭션으로 감쌈

begin;

-- ============================================================
-- 1. 테이블
-- ============================================================

create table meetings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date_range_start date not null,
  date_range_end date not null,
  confirmed_date date,
  created_at timestamptz default now() not null
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  name text not null,
  color text,
  display_order int not null,
  created_at timestamptz default now() not null,
  unique (meeting_id, name),
  unique (meeting_id, color)
);

create table availabilities (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade not null,
  available_date date not null,
  created_at timestamptz default now() not null,
  unique (participant_id, available_date)
);

-- ============================================================
-- 2. 인덱스
-- ============================================================

create index idx_participants_meeting on participants(meeting_id);
create index idx_availabilities_participant on availabilities(participant_id);
create index idx_availabilities_date on availabilities(available_date);

-- ============================================================
-- 3. RLS
-- ============================================================

alter table meetings enable row level security;
alter table participants enable row level security;
alter table availabilities enable row level security;

-- meetings: 누구나 read (링크 보유자), 본인(host)만 쓰기
create policy "meetings_select_all" on meetings
  for select using (true);
create policy "meetings_insert_own" on meetings
  for insert with check (auth.uid() = host_id);
create policy "meetings_update_own" on meetings
  for update using (auth.uid() = host_id);
create policy "meetings_delete_own" on meetings
  for delete using (auth.uid() = host_id);

-- participants: 누구나 read, host만 추가/삭제, 모두 update (color 선택용)
create policy "participants_select_all" on participants
  for select using (true);
create policy "participants_insert_host" on participants
  for insert with check (
    exists (select 1 from meetings where id = meeting_id and host_id = auth.uid())
  );
create policy "participants_delete_host" on participants
  for delete using (
    exists (select 1 from meetings where id = meeting_id and host_id = auth.uid())
  );
create policy "participants_update_all" on participants
  for update using (true);

-- availabilities: 누구나 read/insert/delete (참여자 이름 기반, MVP는 친구 신뢰 가정)
create policy "availabilities_select_all" on availabilities
  for select using (true);
create policy "availabilities_insert_all" on availabilities
  for insert with check (true);
create policy "availabilities_delete_all" on availabilities
  for delete using (true);

-- ============================================================
-- 4. Realtime publication (client에서 변경 구독용)
-- ============================================================

alter publication supabase_realtime add table meetings;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table availabilities;

commit;
