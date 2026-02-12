// ============================================
// tabi-box: TypeScript Types
// ============================================

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  share_id: string;
  created_at: string;
}

export interface Member {
  id: string;
  trip_id: string;
  name: string;
  avatar_emoji: string;
  color: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  trip_id: string;
  title: string;
  booking_site: string | null;
  booking_number: string | null;
  scheduled_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationMember {
  id: string;
  reservation_id: string;
  member_id: string;
  created_at: string;
}

export interface ReservationAttachment {
  id: string;
  reservation_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
}

// JOIN済みの予約カード（表示用）
export interface ReservationWithDetails extends Reservation {
  members: Member[]; // 複数担当者対応
  attachments: ReservationAttachment[];
}

// フォーム用
export interface ReservationFormData {
  title: string;
  member_ids: string[]; // 複数担当者対応
  booking_site: string;
  booking_number: string;
  scheduled_at: string;
  memo: string;
}
