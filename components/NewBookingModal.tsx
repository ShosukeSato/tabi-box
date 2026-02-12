"use client";

import { useState } from "react";
import {
  Member,
  ReservationFormData,
  ReservationWithDetails,
  ReservationAttachment,
} from "@/lib/types";
import FileUpload from "./FileUpload";
import MemberBadge from "./MemberBadge";
import { X, Save, Loader2, Trash2 } from "lucide-react";

interface ReservationModalProps {
  members: Member[];
  /** 新規作成 */
  onSubmit: (data: ReservationFormData, files: File[]) => Promise<void>;
  /** 編集（idを含めて更新） */
  onUpdate?: (
    id: string,
    data: ReservationFormData,
    files: File[],
    removedAttachmentIds: string[]
  ) => Promise<void>;
  onClose: () => void;
  /** 編集対象（渡されたら編集モード） */
  editingReservation?: ReservationWithDetails | null;
}

/** datetime-local用にフォーマット */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function ReservationModal({
  members,
  onSubmit,
  onUpdate,
  onClose,
  editingReservation,
}: ReservationModalProps) {
  const isEdit = !!editingReservation;

  const [form, setForm] = useState<ReservationFormData>(() => {
    if (editingReservation) {
      return {
        title: editingReservation.title,
        member_ids: editingReservation.members.map((m) => m.id),
        booking_site: editingReservation.booking_site || "",
        booking_number: editingReservation.booking_number || "",
        scheduled_at: toDatetimeLocal(editingReservation.scheduled_at),
        memo: editingReservation.memo || "",
      };
    }
    return {
      title: "",
      member_ids: [],
      booking_site: "",
      booking_number: "",
      scheduled_at: "",
      memo: "",
    };
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 既存添付ファイル（編集モード用）
  const [existingAttachments, setExistingAttachments] = useState<
    ReservationAttachment[]
  >(editingReservation?.attachments || []);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    []
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /** メンバーのトグル選択（複数選択対応） */
  const toggleMember = (memberId: string) => {
    setForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(memberId)
        ? prev.member_ids.filter((id) => id !== memberId)
        : [...prev.member_ids, memberId],
    }));
  };

  const handleRemoveExisting = (att: ReservationAttachment) => {
    setExistingAttachments(existingAttachments.filter((a) => a.id !== att.id));
    setRemovedAttachmentIds([...removedAttachmentIds, att.id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      if (isEdit && onUpdate && editingReservation) {
        await onUpdate(
          editingReservation.id,
          form,
          files,
          removedAttachmentIds
        );
      } else {
        await onSubmit(form, files);
      }
      onClose();
    } catch (err) {
      console.error("Error saving reservation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ハンドルバー (モバイル) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "✏️ 予約を編集" : "📝 予約を登録"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 項目名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              項目名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例: 1日目 ホテル"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              required
              autoFocus
            />
          </div>

          {/* 予約担当者（複数選択対応） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              予約者（担当者）
              <span className="text-xs text-muted font-normal ml-2">
                複数選択OK
              </span>
            </label>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = form.member_ids.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary-light ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <MemberBadge member={m} size="sm" />
                      <span>{m.name}</span>
                      {isSelected && (
                        <span className="text-primary text-xs font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-border">
                先にヘッダーの「＋追加」からメンバーを追加してください
              </p>
            )}
            {form.member_ids.length > 0 && (
              <p className="text-xs text-primary mt-1.5">
                {form.member_ids.length}人 選択中
              </p>
            )}
          </div>

          {/* 予約サイト & 予約番号 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                予約サイト / 方法
              </label>
              <input
                type="text"
                name="booking_site"
                value={form.booking_site}
                onChange={handleChange}
                placeholder="例: 楽天トラベル"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                予約番号
              </label>
              <input
                type="text"
                name="booking_number"
                value={form.booking_number}
                onChange={handleChange}
                placeholder="例: RKT-123456"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              />
            </div>
          </div>

          {/* 日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              日時
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              メモ
            </label>
            <textarea
              name="memo"
              value={form.memo}
              onChange={handleChange}
              rows={2}
              placeholder="補足情報、注意事項など"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-shadow"
            />
          </div>

          {/* 既存添付ファイル（編集モードのみ） */}
          {isEdit && existingAttachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                📎 登録済みファイル
              </label>
              <div className="flex gap-2 flex-wrap">
                {existingAttachments.map((att) => {
                  const isImage = att.file_type?.startsWith("image/");
                  return (
                    <div
                      key={att.id}
                      className="relative group/att rounded-xl overflow-hidden border border-border"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          className="w-20 h-20 object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center px-1">
                          <span className="text-2xl">📄</span>
                          <span className="text-[10px] text-gray-500 truncate w-full text-center">
                            {att.file_name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(att)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                        title="削除"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 新規ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              📸 {isEdit ? "ファイルを追加" : "証拠ファイル（スクショ・PDF）"}
            </label>
            <FileUpload files={files} onChange={setFiles} />
          </div>

          {/* 送信ボタン */}
          <div className="pt-1 pb-2">
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? "変更を保存" : "予約を登録"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
