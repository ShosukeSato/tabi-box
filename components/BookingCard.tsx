"use client";

import { useState } from "react";
import { ReservationWithDetails, ReservationAttachment } from "@/lib/types";
import MemberBadge from "./MemberBadge";
import {
  Calendar,
  Globe,
  Hash,
  FileText,
  ImageIcon,
  FileDown,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ReservationCardProps {
  reservation: ReservationWithDetails;
  onDelete?: (id: string) => void;
  onEdit?: (reservation: ReservationWithDetails) => void;
}

/* ── 画像ライトボックス ── */
function Lightbox({
  attachments,
  index,
  onClose,
  onNav,
}: {
  attachments: ReservationAttachment[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const att = attachments[index];
  const isImage = att.file_type?.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm lightbox-enter"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white"
        onClick={onClose}
      >
        <X className="w-7 h-7" />
      </button>

      {attachments.length > 1 && (
        <button
          className="absolute left-4 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onNav((index - 1 + attachments.length) % attachments.length);
          }}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      <div
        className="max-w-3xl max-h-[85vh] mx-12"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={att.file_url}
            alt={att.file_name}
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
          />
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <FileDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-2">{att.file_name}</p>
            <a
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              ファイルを開く →
            </a>
          </div>
        )}
        <p className="text-center text-white/60 text-xs mt-3">
          {att.file_name}
          {attachments.length > 1 &&
            ` (${index + 1}/${attachments.length})`}
        </p>
      </div>

      {attachments.length > 1 && (
        <button
          className="absolute right-4 text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onNav((index + 1) % attachments.length);
          }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}

/* ── メインカード ── */
export default function ReservationCard({
  reservation,
  onDelete,
  onEdit,
}: ReservationCardProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const formattedDate = reservation.scheduled_at
    ? format(new Date(reservation.scheduled_at), "M月d日 (E) HH:mm", {
        locale: ja,
      })
    : null;

  const imageAttachments =
    reservation.attachments?.filter((a) =>
      a.file_type?.startsWith("image/")
    ) ?? [];
  const otherAttachments =
    reservation.attachments?.filter(
      (a) => !a.file_type?.startsWith("image/")
    ) ?? [];

  /** カード本体のクリック → 編集モーダルを開く */
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-edit]")) return;
    onEdit?.(reservation);
  };

  return (
    <>
      <div
        className={`bg-card-bg rounded-2xl border border-border shadow-sm card-hover p-5 relative group ${
          onEdit ? "cursor-pointer" : ""
        }`}
        onClick={handleCardClick}
      >
        {/* ── 担当者バッジ（右上） ── */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {reservation.members.length > 0 ? (
            reservation.members.length <= 2 ? (
              /* 2人以下: バッジを並べて表示 */
              <div className="flex items-center gap-1.5">
                {reservation.members.map((m) => (
                  <MemberBadge
                    key={m.id}
                    member={m}
                    size="sm"
                    showName={reservation.members.length === 1}
                  />
                ))}
              </div>
            ) : (
              /* 3人以上: アバター重ねて表示 + 人数 */
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {reservation.members.slice(0, 3).map((m) => (
                    <MemberBadge key={m.id} member={m} size="sm" />
                  ))}
                </div>
                {reservation.members.length > 3 && (
                  <span className="text-xs text-muted ml-1">
                    +{reservation.members.length - 3}
                  </span>
                )}
              </div>
            )
          ) : (
            <MemberBadge member={null} size="sm" />
          )}
        </div>

        {/* ── タイトル ── */}
        <h3 className="text-[17px] font-bold text-gray-900 pr-28 mb-2.5 leading-snug">
          {reservation.title}
        </h3>

        {/* ── 担当者名（複数人の場合テキストで表示） ── */}
        {reservation.members.length > 1 && (
          <div className="text-xs text-muted mb-2">
            👥{" "}
            {reservation.members.map((m) => m.name).join("、")}
          </div>
        )}

        {/* ── メタ情報 ── */}
        <div className="space-y-1.5 text-[13px] text-gray-500">
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
          {reservation.booking_site && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{reservation.booking_site}</span>
            </div>
          )}
          {reservation.booking_number && (
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
              <code className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                {reservation.booking_number}
              </code>
            </div>
          )}
          {reservation.memo && (
            <div className="flex items-start gap-2 pt-0.5">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap leading-relaxed text-gray-600">
                {reservation.memo}
              </span>
            </div>
          )}
        </div>

        {/* ── 画像サムネイル ── */}
        {imageAttachments.length > 0 && (
          <div className="mt-4" data-no-edit>
            <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>証拠スクショ ({imageAttachments.length})</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageAttachments.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  data-no-edit
                  onClick={(e) => {
                    e.stopPropagation();
                    const allIdx = reservation.attachments.indexOf(att);
                    setLightboxIdx(allIdx);
                  }}
                  className="shrink-0 rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-24 h-24 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── その他ファイル ── */}
        {otherAttachments.length > 0 && (
          <div
            className={imageAttachments.length > 0 ? "mt-2" : "mt-4"}
            data-no-edit
          >
            <div className="flex flex-wrap gap-2">
              {otherAttachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-no-edit
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary-light transition-colors"
                >
                  <FileDown className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">
                    {att.file_name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── アクションボタン（右下） ── */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              data-no-edit
              onClick={(e) => {
                e.stopPropagation();
                onEdit(reservation);
              }}
              className="text-gray-300 hover:text-primary p-1.5 rounded-lg hover:bg-primary-light transition-colors"
              title="編集"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              data-no-edit
              onClick={(e) => {
                e.stopPropagation();
                onDelete(reservation.id);
              }}
              className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── ライトボックス ── */}
      {lightboxIdx !== null && reservation.attachments && (
        <Lightbox
          attachments={reservation.attachments}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={(i) => setLightboxIdx(i)}
        />
      )}
    </>
  );
}
