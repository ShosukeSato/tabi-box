-- ============================================
-- tabi-box: Supabase Schema
-- 旅行予約エビデンス管理アプリ
-- Supabase SQL Editor にコピペして実行してください
-- ============================================

-- ============================================
-- 1. テーブル作成
-- ============================================

-- trips: 旅行テーブル
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  share_id text unique not null,
  created_at timestamptz default now()
);

-- members: メンバーテーブル（ログイン不要、名前ベース）
create table members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  name text not null,
  avatar_emoji text not null default '👤',
  color text not null default '#3B82F6',
  created_at timestamptz default now()
);

-- reservations: 予約カードテーブル
create table reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  booking_site text,
  booking_number text,
  scheduled_at timestamptz,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- reservation_members: 予約⇔メンバーの中間テーブル（複数担当者対応）
create table reservation_members (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(reservation_id, member_id)
);

-- reservation_attachments: 証拠ファイルテーブル（スクショ・PDF等）
create table reservation_attachments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text,
  created_at timestamptz default now()
);

-- ============================================
-- 2. インデックス
-- ============================================
create index idx_reservations_trip_id on reservations(trip_id);
create index idx_reservations_scheduled_at on reservations(scheduled_at);
create index idx_members_trip_id on members(trip_id);
create index idx_reservation_attachments_rid on reservation_attachments(reservation_id);
create index idx_reservation_members_rid on reservation_members(reservation_id);
create index idx_reservation_members_mid on reservation_members(member_id);
create index idx_trips_share_id on trips(share_id);

-- ============================================
-- 3. RLS (Row Level Security)
-- MVP: share_id を知っていれば誰でもアクセス可能（Walica式）
-- ============================================
alter table trips enable row level security;
alter table members enable row level security;
alter table reservations enable row level security;
alter table reservation_members enable row level security;
alter table reservation_attachments enable row level security;

create policy "Allow full access to trips"
  on trips for all using (true) with check (true);

create policy "Allow full access to members"
  on members for all using (true) with check (true);

create policy "Allow full access to reservations"
  on reservations for all using (true) with check (true);

create policy "Allow full access to reservation_members"
  on reservation_members for all using (true) with check (true);

create policy "Allow full access to reservation_attachments"
  on reservation_attachments for all using (true) with check (true);

-- ============================================
-- 4. Storage バケット（証拠ファイル保存用）
-- ============================================
insert into storage.buckets (id, name, public)
values ('reservation-evidences', 'reservation-evidences', true);

-- Storage の RLS: 誰でもアップロード・閲覧可能（MVP用）
create policy "Allow public read on reservation-evidences"
  on storage.objects for select
  using (bucket_id = 'reservation-evidences');

create policy "Allow public insert on reservation-evidences"
  on storage.objects for insert
  with check (bucket_id = 'reservation-evidences');
