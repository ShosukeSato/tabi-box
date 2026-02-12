"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Package,
  ArrowRight,
  Loader2,
  Plane,
  Camera,
  Users,
  ClipboardList,
} from "lucide-react";

function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const shareId = generateShareId();

      const { error: insertError } = await supabase.from("trips").insert({
        name: tripName.trim(),
        description: description.trim() || null,
        share_id: shareId,
      });

      if (insertError) throw insertError;

      router.push(`/trips/${shareId}`);
    } catch (err) {
      console.error(err);
      setError("旅行の作成に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── ヘッダー ─── */}
      <header className="bg-card-bg/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center gap-2.5">
          <Package className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold tracking-tight text-gray-900">
            tabi-box
          </span>
        </div>
      </header>

      {/* ─── ヒーロー ─── */}
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          {/* 飛行機アイコン + キャッチコピー */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
              <Plane className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-snug mb-3">
              旅の予約を、
              <br />
              <span className="text-primary">まるごと管理。</span>
            </h2>
            <p className="text-[15px] text-muted leading-relaxed">
              誰が・何を・どこで予約した？
              <br />
              予約番号もスクショもぜんぶ保存。
              <br />
              URLを共有するだけ、ログイン不要。
            </p>
          </div>

          {/* ─── 作成フォーム ─── */}
          <form
            onSubmit={handleCreate}
            className="bg-card-bg rounded-2xl border border-border shadow-lg shadow-black/[0.04] p-7 space-y-5"
          >
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                📦 新しい旅行を作成
              </h3>
              <p className="text-xs text-muted mt-1">
                友達にURLを送るだけでみんな見れます
              </p>
            </div>

            {/* 旅行名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                旅行名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="例: 卒業旅行 2026"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
                required
              />
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メモ（任意）
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 3泊4日、大人4人"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tripName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px] shadow-md shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  旅行を作成する
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* ─── 特徴 ─── */}
          <div className="mt-12 grid grid-cols-3 gap-3">
            {[
              {
                icon: ClipboardList,
                label: "予約を一元管理",
                color: "text-blue-500 bg-blue-50",
              },
              {
                icon: Camera,
                label: "証拠を保存",
                color: "text-amber-500 bg-amber-50",
              },
              {
                icon: Users,
                label: "担当を見える化",
                color: "text-emerald-500 bg-emerald-50",
              },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl bg-card-bg border border-border"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ─── フッター ─── */}
      <footer className="py-5">
        <p className="text-center text-xs text-muted">
          tabi-box — 旅行予約エビデンス管理
        </p>
      </footer>
    </div>
  );
}
