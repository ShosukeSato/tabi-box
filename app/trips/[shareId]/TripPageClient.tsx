"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Trip,
  Member,
  ReservationWithDetails,
  ReservationFormData,
  ReservationAttachment,
} from "@/lib/types";
import TripHeader from "@/components/TripHeader";
import ReservationCard from "@/components/BookingCard";
import ReservationModal from "@/components/NewBookingModal";
import { Plus, PackageOpen, Loader2, Package } from "lucide-react";
import Link from "next/link";

const COLOR_PALETTE = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export default function TripPageClient() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reservations, setReservations] = useState<ReservationWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル: null=閉じ / "new"=新規 / ReservationWithDetails=編集
  const [modalState, setModalState] = useState<
    null | "new" | ReservationWithDetails
  >(null);

  /* ── データ取得 ── */
  const fetchTripData = useCallback(async () => {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (tripError || !tripData) {
        setError("旅行が見つかりませんでした");
        setLoading(false);
        return;
      }

      setTrip(tripData as Trip);

      const { data: membersData } = await supabase
        .from("members")
        .select("*")
        .eq("trip_id", tripData.id)
        .order("created_at");

      const membersArr = (membersData as Member[]) || [];
      setMembers(membersArr);

      const { data: reservationsData } = await supabase
        .from("reservations")
        .select("*")
        .eq("trip_id", tripData.id)
        .order("scheduled_at", { ascending: true, nullsFirst: false });

      const reservationsArr =
        (reservationsData || []) as ReservationWithDetails[];

      for (const r of reservationsArr) {
        // 中間テーブルから担当者を取得
        const { data: rmData } = await supabase
          .from("reservation_members")
          .select("member_id")
          .eq("reservation_id", r.id);

        const memberIds = (rmData || []).map(
          (rm: { member_id: string }) => rm.member_id
        );
        r.members = membersArr.filter((m) => memberIds.includes(m.id));

        // 添付ファイルを取得
        const { data: attachments } = await supabase
          .from("reservation_attachments")
          .select("*")
          .eq("reservation_id", r.id);

        r.attachments = (attachments as ReservationAttachment[]) || [];
      }

      setReservations(reservationsArr);
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  /* ── 旅行名編集 ── */
  const handleEditTrip = async (name: string, description: string) => {
    if (!trip) return;
    const { data, error } = await supabase
      .from("trips")
      .update({ name, description: description || null })
      .eq("id", trip.id)
      .select()
      .single();

    if (!error && data) {
      setTrip(data as Trip);
    }
  };

  /* ── メンバー追加 ── */
  const handleAddMember = async (name: string, emoji: string) => {
    if (!trip) return;
    const color = COLOR_PALETTE[members.length % COLOR_PALETTE.length];

    const { data, error } = await supabase
      .from("members")
      .insert({ trip_id: trip.id, name, avatar_emoji: emoji, color })
      .select()
      .single();

    if (!error && data) setMembers([...members, data as Member]);
  };

  /* ── メンバー編集 ── */
  const handleEditMember = async (
    id: string,
    name: string,
    emoji: string
  ) => {
    const { data, error } = await supabase
      .from("members")
      .update({ name, avatar_emoji: emoji })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const updated = data as Member;
      setMembers(members.map((m) => (m.id === id ? updated : m)));
      setReservations(
        reservations.map((r) => ({
          ...r,
          members: r.members.map((m) => (m.id === id ? updated : m)),
        }))
      );
    }
  };

  /* ── メンバー削除 ── */
  const handleDeleteMember = async (id: string) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (!error) {
      setMembers(members.filter((m) => m.id !== id));
      setReservations(
        reservations.map((r) => ({
          ...r,
          members: r.members.filter((m) => m.id !== id),
        }))
      );
    }
  };

  /* ── ファイルアップロード共通処理 ── */
  const uploadFiles = async (
    reservationId: string,
    tripId: string,
    files: File[]
  ) => {
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${tripId}/${reservationId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("reservation-evidences")
        .upload(filePath, file);

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("reservation-evidences")
          .getPublicUrl(filePath);

        await supabase.from("reservation_attachments").insert({
          reservation_id: reservationId,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
        });
      }
    }
  };

  /* ── 予約の担当者を中間テーブルに同期 ── */
  const syncReservationMembers = async (
    reservationId: string,
    memberIds: string[]
  ) => {
    await supabase
      .from("reservation_members")
      .delete()
      .eq("reservation_id", reservationId);

    if (memberIds.length > 0) {
      const rows = memberIds.map((member_id) => ({
        reservation_id: reservationId,
        member_id,
      }));
      await supabase.from("reservation_members").insert(rows);
    }
  };

  /** datetime-local の値をタイムゾーン付きISOに変換 */
  const toISOWithTZ = (datetimeLocal: string): string | null => {
    if (!datetimeLocal) return null;
    return new Date(datetimeLocal).toISOString();
  };

  /* ── 予約新規作成 ── */
  const handleCreateReservation = async (
    formData: ReservationFormData,
    files: File[]
  ) => {
    if (!trip) return;

    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        trip_id: trip.id,
        title: formData.title,
        booking_site: formData.booking_site || null,
        booking_number: formData.booking_number || null,
        scheduled_at: toISOWithTZ(formData.scheduled_at),
        memo: formData.memo || null,
      })
      .select()
      .single();

    if (reservationError || !reservation)
      throw new Error("予約の作成に失敗しました");

    await syncReservationMembers(reservation.id, formData.member_ids);

    if (files.length > 0) {
      await uploadFiles(reservation.id, trip.id, files);
    }

    await fetchTripData();
  };

  /* ── 予約更新 ── */
  const handleUpdateReservation = async (
    id: string,
    formData: ReservationFormData,
    files: File[],
    removedAttachmentIds: string[]
  ) => {
    if (!trip) return;

    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        title: formData.title,
        booking_site: formData.booking_site || null,
        booking_number: formData.booking_number || null,
        scheduled_at: toISOWithTZ(formData.scheduled_at),
        memo: formData.memo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new Error("予約の更新に失敗しました");

    await syncReservationMembers(id, formData.member_ids);

    if (removedAttachmentIds.length > 0) {
      await supabase
        .from("reservation_attachments")
        .delete()
        .in("id", removedAttachmentIds);
    }

    if (files.length > 0) {
      await uploadFiles(id, trip.id, files);
    }

    await fetchTripData();
  };

  /* ── 予約削除 ── */
  const handleDeleteReservation = async (id: string) => {
    if (!confirm("この予約を削除しますか？")) return;
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);
    if (!error) setReservations(reservations.filter((r) => r.id !== id));
  };

  /* ── ローディング ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  /* ── エラー ── */
  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            {error || "旅行が見つかりませんでした"}
          </h2>
          <p className="text-sm text-muted mb-6">
            URLが正しいか確認してください
          </p>
          <Link
            href="/"
            className="text-primary hover:underline text-sm font-medium"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  /* ── メイン ── */
  return (
    <div className="min-h-screen bg-background">
      {/* ─── ヘッダーバー ─── */}
      <header className="bg-card-bg/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="text-base font-bold tracking-tight text-gray-900">
              tabi-box
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ─── 旅行ヘッダー ─── */}
        <TripHeader
          trip={trip}
          members={members}
          onAddMember={handleAddMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          onEditTrip={handleEditTrip}
        />

        {/* ─── 予約一覧ヘッダー ─── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">予約一覧</h2>
            {reservations.length > 0 && (
              <p className="text-xs text-muted mt-0.5">
                {reservations.length}件の予約 · 日時順に表示 · タップで編集
              </p>
            )}
          </div>
          <button
            onClick={() => setModalState("new")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            予約を追加
          </button>
        </div>

        {/* ─── 予約リスト ─── */}
        {reservations.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <PackageOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 mb-1 font-medium">
              まだ予約が登録されていません
            </p>
            <p className="text-sm text-muted mb-5">
              「予約を追加」で最初の予約を登録しましょう
            </p>
            <button
              onClick={() => setModalState("new")}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium bg-primary-light px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              最初の予約を追加
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation, index) => {
              const showDateLabel =
                reservation.scheduled_at &&
                (index === 0 ||
                  !reservations[index - 1].scheduled_at ||
                  new Date(reservation.scheduled_at).toDateString() !==
                    new Date(
                      reservations[index - 1].scheduled_at!
                    ).toDateString());

              return (
                <div key={reservation.id}>
                  {showDateLabel && (
                    <div className="flex items-center gap-3 mb-3 mt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 shrink-0" />
                      <span className="text-sm font-bold text-primary">
                        {new Date(
                          reservation.scheduled_at!
                        ).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  <ReservationCard
                    reservation={reservation}
                    onDelete={handleDeleteReservation}
                    onEdit={(r) => setModalState(r)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── モーダル（新規 or 編集） ─── */}
      {modalState !== null && (
        <ReservationModal
          members={members}
          onSubmit={handleCreateReservation}
          onUpdate={handleUpdateReservation}
          onClose={() => setModalState(null)}
          editingReservation={
            modalState === "new" ? null : modalState
          }
        />
      )}
    </div>
  );
}
