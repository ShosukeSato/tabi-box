"use client";

import { Trip, Member } from "@/lib/types";
import MemberBadge from "./MemberBadge";
import {
  Share2,
  Users,
  Plus,
  Check,
  Package,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

interface TripHeaderProps {
  trip: Trip;
  members: Member[];
  onAddMember: (name: string, emoji: string) => void;
  onEditMember: (id: string, name: string, emoji: string) => void;
  onDeleteMember: (id: string) => void;
  onEditTrip: (name: string, description: string) => void;
}

const EMOJI_OPTIONS = [
  "👤","🧑","👩","🧔","👧","🐱","🐶","🐻","🦊","🐸","🌸","⭐",
];

export default function TripHeader({
  trip,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onEditTrip,
}: TripHeaderProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmoji, setNewMemberEmoji] = useState("👤");
  const [copied, setCopied] = useState(false);

  // 旅行名編集
  const [editingTrip, setEditingTrip] = useState(false);
  const [editTripName, setEditTripName] = useState(trip.name);
  const [editTripDesc, setEditTripDesc] = useState(trip.description || "");

  // 編集中のメンバーID (null = 編集なし)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberEmoji, setEditMemberEmoji] = useState("👤");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trips/${trip.share_id}`
      : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim(), newMemberEmoji);
      setNewMemberName("");
      setNewMemberEmoji("👤");
      setShowAddMember(false);
    }
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setEditMemberName(member.name);
    setEditMemberEmoji(member.avatar_emoji);
    setShowAddMember(false); // 追加フォームは閉じる
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
    setEditMemberName("");
    setEditMemberEmoji("👤");
  };

  const handleEditMemberSubmit = () => {
    if (editingMemberId && editMemberName.trim()) {
      onEditMember(editingMemberId, editMemberName.trim(), editMemberEmoji);
      cancelEditMember();
    }
  };

  const handleDeleteMember = (member: Member) => {
    if (confirm(`「${member.name}」をメンバーから削除しますか？\n※ この人が担当の予約からも外れます。`)) {
      onDeleteMember(member.id);
      if (editingMemberId === member.id) cancelEditMember();
    }
  };

  const startEditTrip = () => {
    setEditingTrip(true);
    setEditTripName(trip.name);
    setEditTripDesc(trip.description || "");
  };

  const cancelEditTrip = () => {
    setEditingTrip(false);
  };

  const handleEditTripSubmit = () => {
    if (editTripName.trim()) {
      onEditTrip(editTripName.trim(), editTripDesc.trim());
      setEditingTrip(false);
    }
  };

  return (
    <div className="bg-card-bg rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
      {/* 上部: グラデーションバー */}
      <div className="h-2 bg-gradient-to-r from-primary via-blue-400 to-cyan-400" />

      <div className="p-6">
        {/* タイトル行 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>

            {editingTrip ? (
              /* ── 旅行名編集モード ── */
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={editTripName}
                  onChange={(e) => setEditTripName(e.target.value)}
                  placeholder="旅行名"
                  className="w-full border border-border rounded-xl px-3 py-2 text-base font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditTripSubmit();
                    if (e.key === "Escape") cancelEditTrip();
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={editTripDesc}
                  onChange={(e) => setEditTripDesc(e.target.value)}
                  placeholder="メモ（任意）例: 3泊4日、大人4人"
                  className="w-full border border-border rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditTripSubmit();
                    if (e.key === "Escape") cancelEditTrip();
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEditTripSubmit}
                    disabled={!editTripName.trim()}
                    className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEditTrip}
                    className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              /* ── 旅行名表示モード ── */
              <button
                onClick={startEditTrip}
                className="min-w-0 text-left group/title"
                title="クリックして旅行名を編集"
              >
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {trip.name}
                  </h1>
                  <Pencil className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                </div>
                {trip.description && (
                  <p className="text-sm text-muted mt-0.5 truncate">
                    {trip.description}
                  </p>
                )}
              </button>
            )}
          </div>

          {!editingTrip && (
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl font-medium transition-all shrink-0 ${
                copied
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  コピー済み
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  共有リンク
                </>
              )}
            </button>
          )}
        </div>

        {/* メンバー一覧 */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium text-gray-600">メンバー</span>
            {members.length > 0 && (
              <span className="text-xs text-muted">
                · タップで編集
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  editingMemberId === m.id
                    ? cancelEditMember()
                    : startEditMember(m)
                }
                className={`rounded-xl transition-all ${
                  editingMemberId === m.id
                    ? "ring-2 ring-primary/30 bg-primary-light"
                    : "hover:bg-gray-50"
                }`}
              >
                <MemberBadge member={m} size="md" showName />
              </button>
            ))}
            <button
              onClick={() => {
                setShowAddMember(!showAddMember);
                cancelEditMember();
              }}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark px-3 py-1.5 border border-dashed border-primary/30 rounded-full hover:bg-primary-light transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </button>
          </div>

          {/* ── メンバー編集フォーム ── */}
          {editingMemberId && (
            <div className="mt-3 p-4 bg-amber-50/80 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-amber-800">
                  ✏️ メンバーを編集
                </span>
                <button
                  onClick={cancelEditMember}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    名前
                  </label>
                  <input
                    type="text"
                    value={editMemberName}
                    onChange={(e) => setEditMemberName(e.target.value)}
                    placeholder="例: たろう"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleEditMemberSubmit()
                    }
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    アイコン
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditMemberEmoji(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          editMemberEmoji === emoji
                            ? "bg-primary text-white scale-110 shadow-md"
                            : "bg-white border border-border hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditMemberSubmit}
                    disabled={!editMemberName.trim()}
                    className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    変更を保存
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteMember(
                        members.find((m) => m.id === editingMemberId)!
                      )
                    }
                    className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors border border-red-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    削除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── メンバー追加フォーム ── */}
          {showAddMember && !editingMemberId && (
            <div className="mt-3 p-4 bg-gray-50/80 rounded-xl border border-border">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    名前
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="例: たろう"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    アイコン
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewMemberEmoji(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          newMemberEmoji === emoji
                            ? "bg-primary text-white scale-110 shadow-md"
                            : "bg-white border border-border hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  メンバーを追加
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
