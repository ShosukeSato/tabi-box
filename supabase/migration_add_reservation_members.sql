-- ============================================
-- tabi-box: マイグレーション
-- 予約の複数担当者対応 (reservation_members 中間テーブル追加)
-- 既存のDBに対して Supabase SQL Editor で実行してください
-- ============================================

-- 1. reservation_members 中間テーブルを作成
create table if not exists reservation_members (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(reservation_id, member_id)
);

-- 2. インデックス
create index if not exists idx_reservation_members_rid on reservation_members(reservation_id);
create index if not exists idx_reservation_members_mid on reservation_members(member_id);

-- 3. RLS
alter table reservation_members enable row level security;

create policy "Allow full access to reservation_members"
  on reservation_members for all using (true) with check (true);

-- 4. 既存データのマイグレーション
--    reservations.member_id に値が入っている行を reservation_members に移行
insert into reservation_members (reservation_id, member_id)
select id, member_id from reservations where member_id is not null
on conflict do nothing;

-- 5. (任意) member_id カラムを残しつつ、今後は reservation_members を使用
-- 将来的に不要になったら以下で削除可能:
-- alter table reservations drop column member_id;
