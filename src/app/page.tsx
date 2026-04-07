"use client";

import { useEffect, useState, useCallback } from "react";
import type { ShoppingItem } from "@/lib/supabase";
import { DEFAULT_STORES, CATEGORIES, STORE_COLORS, CATEGORY_COLORS } from "@/lib/supabase";

type Tab = "list" | "store" | "history";
type ViewMode = "store" | "category";

const BASE_STORES = [...DEFAULT_STORES] as string[];

// ─── Dark mode colors ──────────────────────────────────────────────
const DK_PAGE    = "#1a1a2e";
const DK_CARD    = "#16213e";
const DK_INPUT   = "#0f3460";
const DK_BORDER  = "#2a2a4a";
const DK_TEXT    = "#e0e0e0";
const DK_SUBTEXT = "#9ca3af";

export default function Home() {
  // ── state ──
  const [items, setItems]             = useState<ShoppingItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<Tab>("list");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", store: "", quantity: "", memo: "" });

  const [mounted, setMounted]           = useState(false);
  const [userId, setUserId]             = useState<string | null>(null);
  const [isDark, setIsDark]             = useState(false);
  const [customStores, setCustomStores] = useState<string[]>([]);
  const [storeOrder, setStoreOrder]     = useState<string[]>([]);
  const [isSortMode, setIsSortMode]     = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");

  // ── 修正②: 編集モーダル ──
  const [editItem, setEditItem]           = useState<ShoppingItem | null>(null);
  const [editForm, setEditForm]           = useState({ name: "", category: "", store: "", quantity: "", memo: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── 修正④: カテゴリ別表示 ──
  const [viewMode, setViewMode]               = useState<ViewMode>("store");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ── localStorage 初期化 ──
  useEffect(() => {
    setMounted(true);
    // ユーザーID: 初回アクセス時にUUIDを生成して永続化
    let uid = localStorage.getItem("userId");
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem("userId", uid);
    }
    setUserId(uid);

    const dark   = localStorage.getItem("darkMode") === "true";
    const saved  = localStorage.getItem("customStores");
    const order  = localStorage.getItem("storeOrder");
    const custom = saved ? (JSON.parse(saved) as string[]) : [];
    setIsDark(dark);
    setCustomStores(custom);
    setStoreOrder(order ? (JSON.parse(order) as string[]) : [...BASE_STORES, ...custom]);
  }, []);

  // ── allStores ──
  const allStoreSet = new Set([...BASE_STORES, ...customStores]);
  const allStores   = [
    ...storeOrder.filter((s) => allStoreSet.has(s)),
    ...[...allStoreSet].filter((s) => !storeOrder.includes(s)),
  ];

  const dk = mounted && isDark;

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", String(next));
  };

  // ── 店舗追加 ──
  const handleAddStore = () => {
    const name = newStoreName.trim();
    if (!name || allStores.includes(name)) {
      setNewStoreName("");
      setShowAddStore(false);
      return;
    }
    const nextCustom = [...customStores, name];
    const nextOrder  = [...storeOrder, name];
    setCustomStores(nextCustom);
    setStoreOrder(nextOrder);
    localStorage.setItem("customStores", JSON.stringify(nextCustom));
    localStorage.setItem("storeOrder", JSON.stringify(nextOrder));
    setNewStoreName("");
    setShowAddStore(false);
  };

  // ── 修正①: ↑↓ 並べ替え ──
  const moveStore = (store: string, direction: "up" | "down") => {
    const idx = allStores.indexOf(store);
    if (direction === "up"   && idx === 0)                    return;
    if (direction === "down" && idx === allStores.length - 1) return;
    const next     = [...allStores];
    const swapIdx  = direction === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setStoreOrder(next);
    localStorage.setItem("storeOrder", JSON.stringify(next));
  };

  // ── アイテム取得 ──
  const fetchItems = useCallback(async (filter: "all" | "pending" | "purchased" = "all") => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/items?filter=${filter}`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setItems(data.items);
    } catch {
      setError("データの取得に失敗しました。Supabaseの設定を確認してください。");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchItems(tab === "history" ? "purchased" : "pending");
  }, [tab, fetchItems, userId]);

  const handleToggle = async (item: ShoppingItem) => {
    if (!userId) return;
    const newVal = !item.is_purchased;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: newVal } : i)));
    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ is_purchased: newVal }),
      });
      setTimeout(() => fetchItems(tab === "history" ? "purchased" : "pending"), 600);
    } catch {
      setError("更新に失敗しました");
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !newVal } : i)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId || !confirm("削除しますか？")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/items/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
    } catch {
      setError("削除に失敗しました");
      fetchItems();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("追加失敗");
      setForm({ name: "", category: "", store: "", quantity: "", memo: "" });
      setShowAddForm(false);
      setTab("list");
      fetchItems("pending");
    } catch {
      setError("追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 修正②: 編集 ──
  const handleEditOpen = (item: ShoppingItem) => {
    setEditItem(item);
    setEditForm({
      name:     item.name,
      category: item.category ?? "",
      store:    item.store    ?? "",
      quantity: item.quantity ?? "",
      memo:     item.memo     ?? "",
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !editForm.name.trim() || !userId) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("更新失敗");
      setEditItem(null);
      fetchItems(tab === "history" ? "purchased" : "pending");
    } catch {
      setError("更新に失敗しました");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── 派生 ──
  const pendingItems   = items.filter((i) => !i.is_purchased);
  const purchasedItems = items.filter((i) => i.is_purchased);
  const itemsByStore: Record<string, ShoppingItem[]> = {};
  for (const s of allStores) itemsByStore[s] = pendingItems.filter((i) => i.store === s);
  const noStoreItems = pendingItems.filter((i) => !i.store || !allStoreSet.has(i.store));

  // ── 修正④: カテゴリ別派生 ──
  const allCategories = [...CATEGORIES, "未分類"] as string[];
  const itemsByCategory: Record<string, ShoppingItem[]> = {};
  for (const c of CATEGORIES) {
    itemsByCategory[c] = pendingItems.filter((i) => i.category === c);
  }
  itemsByCategory["未分類"] = pendingItems.filter(
    (i) => !i.category || !(CATEGORIES as readonly string[]).includes(i.category)
  );

  // ── style helpers ──
  const sPage  = dk ? { background: DK_PAGE,  color: DK_TEXT }        : {};
  const sHeader = dk ? { background: DK_CARD,  borderColor: DK_BORDER } : {};
  const sCard  = dk ? { background: DK_CARD,  borderColor: DK_BORDER } : {};
  const sInput = dk ? { background: DK_INPUT, borderColor: DK_BORDER, color: DK_TEXT } : {};
  const sModal = dk ? { background: DK_CARD }  : {};
  const sText  = dk ? { color: DK_TEXT }   : {};
  const sSub   = dk ? { color: DK_SUBTEXT } : {};

  const chipStyle = (store: string) => {
    const isSelected = selectedStore === store;
    const hasItems   = (itemsByStore[store]?.length ?? 0) > 0;
    return [
      "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all select-none",
      isSelected                              ? "bg-emerald-500 text-white border-emerald-500" : "",
      !isSelected && hasItems  && !dk         ? "bg-white text-gray-700 border-gray-300" : "",
      !isSelected && !hasItems && !dk         ? "bg-gray-50 text-gray-300 border-gray-100" : "",
      !isSelected && dk                       ? "border-[#2a2a4a]" : "",
    ].filter(Boolean).join(" ");
  };

  const catChipStyle = (cat: string | null) => {
    const isSelected = selectedCategory === cat;
    return [
      "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
      isSelected           ? "bg-blue-600 text-white border-blue-600" : "",
      !isSelected && !dk   ? "bg-gray-50 text-gray-600 border-gray-200" : "",
      !isSelected && dk    ? "border-[#2a2a4a]" : "",
    ].filter(Boolean).join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200" style={sPage}>

      {/* ── Header ── */}
      <header className="bg-white shadow-sm sticky top-0 z-10 transition-colors duration-200" style={sHeader}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800" style={sText}>🛒 買い物リスト</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all active:scale-90"
              style={dk ? { background: DK_INPUT } : { background: "#f3f4f6" }}
              title={dk ? "ライトモードへ" : "ダークモードへ"}
            >
              {dk ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-md active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="max-w-lg mx-auto flex border-t"
          style={dk ? { borderColor: DK_BORDER } : { borderColor: "#f3f4f6" }}
        >
          {([
            { key: "list",    label: "📋 一覧" },
            { key: "store",   label: "🏪 店舗別" },
            { key: "history", label: "✅ 購入済み" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === key ? "border-b-2 border-emerald-500 text-emerald-500" : ""
              }`}
              style={tab === key ? {} : sSub}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Add Form Modal ── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto transition-colors"
            style={sModal}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={sText}>商品を追加</h2>
              <button onClick={() => setShowAddForm(false)} className="text-2xl leading-none" style={sText}>×</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：牛乳"
                  className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                  style={sInput}
                  autoComplete="off"
                  data-1p-ignore="true"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={sText}>カテゴリ</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                    style={sInput}
                  >
                    <option value="">選択</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={sText}>数量</label>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="例：2個"
                    className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                    style={sInput}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>店舗</label>
                {allStores.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: dk ? DK_SUBTEXT : "#9ca3af" }}>
                    店舗がまだ登録されていません。「店舗別」タブから追加できます。
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {allStores.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, store: form.store === s ? "" : s })}
                        className={`text-xs py-1.5 px-1 rounded-lg border transition-all ${
                          form.store === s ? "border-emerald-500 bg-emerald-50 font-medium" : ""
                        }`}
                        style={{
                          ...(dk
                            ? { borderColor: form.store === s ? undefined : DK_BORDER, background: form.store === s ? undefined : DK_INPUT, color: DK_TEXT }
                            : { color: "#111827" }),
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {showAddStore ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddStore())}
                      placeholder="店舗名を入力"
                      className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                      style={sInput}
                      autoFocus
                    />
                    <button type="button" onClick={handleAddStore}
                      className="bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium">
                      追加
                    </button>
                    <button type="button" onClick={() => { setShowAddStore(false); setNewStoreName(""); }}
                      className="rounded-lg px-2 py-1.5 text-sm border"
                      style={dk ? { borderColor: DK_BORDER, color: DK_TEXT } : { color: "#6b7280" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddStore(true)}
                    className="mt-2 text-xs text-emerald-600 underline"
                  >
                    ＋ 新規店舗を追加
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>メモ</label>
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="備考など"
                  className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                  style={sInput}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !form.name.trim()}
                className="w-full bg-emerald-500 text-white rounded-xl py-3 font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
              >
                {submitting ? "追加中..." : "追加する"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 修正②: 編集モーダル ── */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl"
            style={sModal}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={sText}>✏️ 商品を編集</h2>
              <button onClick={() => setEditItem(null)} className="text-2xl leading-none" style={sText}>×</button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                  style={sInput}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={sText}>カテゴリ</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                    style={sInput}
                  >
                    <option value="">未設定</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={sText}>数量</label>
                  <input
                    type="text"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    placeholder="例：2個"
                    className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                    style={sInput}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>店舗</label>
                <select
                  value={editForm.store}
                  onChange={(e) => setEditForm({ ...editForm, store: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                  style={sInput}
                >
                  <option value="">未設定</option>
                  {allStores.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={sText}>メモ</label>
                <input
                  type="text"
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  placeholder="備考など"
                  className="w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 text-gray-900"
                  style={sInput}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="flex-1 border rounded-xl py-3 font-medium text-base transition-all"
                  style={dk ? { borderColor: DK_BORDER, color: DK_TEXT, background: DK_INPUT } : { color: "#6b7280", borderColor: "#d1d5db" }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting || !editForm.name.trim()}
                  className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {editSubmitting ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm flex justify-between items-start">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── LIST TAB ── */}
            {tab === "list" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold" style={sText}>
                    未購入 <span className="text-emerald-500 font-bold">{pendingItems.length}</span>件
                  </h2>
                  <button onClick={() => fetchItems("pending")} className="text-xs underline" style={sSub}>更新</button>
                </div>
                {pendingItems.length === 0
                  ? <EmptyState message="未購入の商品はありません 🎉" dark={dk} />
                  : <div className="space-y-2">
                      {pendingItems.map((item) => (
                        <ItemCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditOpen} dark={dk} sCard={sCard} />
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ── STORE TAB ── */}
            {tab === "store" && (
              <div>
                {/* 修正④: 店舗別 / カテゴリ別 切り替え */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setViewMode("store")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      viewMode === "store" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                    style={viewMode !== "store" && dk ? { background: DK_INPUT, color: DK_TEXT } : {}}
                  >
                    🏪 店舗別
                  </button>
                  <button
                    onClick={() => setViewMode("category")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      viewMode === "category" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                    style={viewMode !== "category" && dk ? { background: DK_INPUT, color: DK_TEXT } : {}}
                  >
                    📦 カテゴリ別
                  </button>
                </div>

                {/* ── 店舗別ビュー ── */}
                {viewMode === "store" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                        {/* すべてチップ */}
                        <button
                          onClick={() => !isSortMode && setSelectedStore(null)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            selectedStore === null ? "bg-emerald-500 text-white border-emerald-500" : ""
                          }`}
                          style={selectedStore !== null ? (dk ? { background: DK_INPUT, borderColor: DK_BORDER, color: DK_TEXT } : {}) : {}}
                        >
                          すべて
                        </button>

                        {/* 修正①: 店舗チップ + ↑↓ボタン */}
                        {allStores.map((s, idx) => (
                          <div key={s} className="flex-shrink-0 flex items-center gap-0.5">
                            <button
                              onClick={() => !isSortMode && setSelectedStore(selectedStore === s ? null : s)}
                              className={chipStyle(s)}
                              style={
                                selectedStore !== s
                                  ? dk
                                    ? { background: DK_INPUT, borderColor: DK_BORDER, color: DK_TEXT }
                                    : {}
                                  : {}
                              }
                            >
                              {s}
                              {!isSortMode && (itemsByStore[s]?.length ?? 0) > 0 && (
                                <span className="ml-1 bg-emerald-100 text-emerald-600 rounded-full px-1.5 text-xs">
                                  {itemsByStore[s].length}
                                </span>
                              )}
                            </button>

                            {isSortMode && (
                              <div className="flex flex-col gap-0.5 ml-0.5">
                                <button
                                  onClick={() => moveStore(s, "up")}
                                  disabled={idx === 0}
                                  className={`text-xs px-1 py-0.5 rounded transition-all ${
                                    idx === 0
                                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  }`}
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => moveStore(s, "down")}
                                  disabled={idx === allStores.length - 1}
                                  className={`text-xs px-1 py-0.5 rounded transition-all ${
                                    idx === allStores.length - 1
                                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  }`}
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* 店舗追加 */}
                        {!isSortMode && (
                          showAddStore ? (
                            <div className="flex gap-1 flex-shrink-0 items-center">
                              <input
                                type="text"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                                placeholder="店舗名"
                                className="border rounded-full px-3 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-900"
                                style={sInput}
                                autoFocus
                              />
                              <button onClick={handleAddStore} className="bg-emerald-500 text-white rounded-full px-2 py-1 text-xs font-medium">追加</button>
                              <button onClick={() => { setShowAddStore(false); setNewStoreName(""); }}
                                className="rounded-full px-2 py-1 text-xs border"
                                style={dk ? { borderColor: DK_BORDER, color: DK_TEXT } : { color: "#6b7280" }}>×</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddStore(true)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm border border-dashed border-emerald-400 text-emerald-500 transition-all"
                            >
                              ＋ 店舗追加
                            </button>
                          )
                        )}
                      </div>

                      {/* 並替ボタン */}
                      <button
                        onClick={() => setIsSortMode(!isSortMode)}
                        className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                          isSortMode ? "bg-emerald-500 text-white border-emerald-500" : ""
                        }`}
                        style={!isSortMode ? (dk ? { borderColor: DK_BORDER, color: DK_TEXT, background: DK_INPUT } : { borderColor: "#d1d5db", color: "#6b7280" }) : {}}
                      >
                        {isSortMode ? "✓ 完了" : "⠿ 並替"}
                      </button>
                    </div>

                    {isSortMode && (
                      <p className="text-xs text-emerald-500 mb-3">↑↓ボタンで店舗の順番を変えてください</p>
                    )}

                    {/* 店舗が空のとき */}
                    {allStores.length === 0 && !showAddStore && (
                      <div className="text-center py-8" style={{ color: dk ? DK_SUBTEXT : "#9ca3af" }}>
                        <p className="text-sm mb-3">店舗がまだ登録されていません。<br />下のボタンから追加してください。</p>
                        <button
                          onClick={() => setShowAddStore(true)}
                          className="text-sm text-emerald-600 underline"
                        >
                          ＋ 店舗を追加する
                        </button>
                      </div>
                    )}

                    {(selectedStore ? [selectedStore] : allStores).map((store) => {
                      const storeItems = itemsByStore[store] ?? [];
                      if (!storeItems.length) return null;
                      return (
                        <div key={store} className="mb-6">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mb-2 ${STORE_COLORS[store] ?? "bg-gray-100 text-gray-600"}`}>
                            🏪 {store} <span className="text-xs opacity-70">({storeItems.length})</span>
                          </div>
                          <div className="space-y-2">
                            {storeItems.map((item) => (
                              <ItemCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditOpen} dark={dk} sCard={sCard} />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {selectedStore === null && noStoreItems.length > 0 && (
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mb-2 bg-gray-100 text-gray-600">
                          📦 店舗未設定 <span className="text-xs opacity-70">({noStoreItems.length})</span>
                        </div>
                        <div className="space-y-2">
                          {noStoreItems.map((item) => (
                            <ItemCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditOpen} dark={dk} sCard={sCard} />
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingItems.length === 0 && <EmptyState message="未購入の商品はありません 🎉" dark={dk} />}
                  </>
                )}

                {/* ── カテゴリ別ビュー ── */}
                {viewMode === "category" && (
                  <>
                    {/* カテゴリチップ */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-3">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={catChipStyle(null)}
                        style={selectedCategory !== null && dk ? { background: DK_INPUT, borderColor: DK_BORDER, color: DK_TEXT } : {}}
                      >
                        すべて
                      </button>
                      {allCategories.map((c) => {
                        const count = itemsByCategory[c]?.length ?? 0;
                        return (
                          <button
                            key={c}
                            onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                            className={catChipStyle(c)}
                            style={selectedCategory !== c && dk ? { background: DK_INPUT, borderColor: DK_BORDER, color: DK_TEXT } : {}}
                          >
                            {c}
                            {count > 0 && (
                              <span className="ml-1 bg-blue-100 text-blue-600 rounded-full px-1.5 text-xs">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {(selectedCategory ? [selectedCategory] : allCategories).map((cat) => {
                      const catItems = itemsByCategory[cat] ?? [];
                      if (!catItems.length) return null;
                      return (
                        <div key={cat} className="mb-6">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mb-2 ${CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600"}`}>
                            📦 {cat} <span className="text-xs opacity-70">({catItems.length})</span>
                          </div>
                          <div className="space-y-2">
                            {catItems.map((item) => (
                              <ItemCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditOpen} dark={dk} sCard={sCard} />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {pendingItems.length === 0 && <EmptyState message="未購入の商品はありません 🎉" dark={dk} />}
                  </>
                )}
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === "history" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold" style={sText}>
                    購入済み <span style={sSub}>{purchasedItems.length}</span>件
                  </h2>
                  <button onClick={() => fetchItems("purchased")} className="text-xs underline" style={sSub}>更新</button>
                </div>
                {purchasedItems.length === 0
                  ? <EmptyState message="購入済みの商品はありません" dark={dk} />
                  : <div className="space-y-2">
                      {purchasedItems.map((item) => (
                        <ItemCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditOpen} dark={dk} sCard={sCard} dimmed />
                      ))}
                    </div>
                }
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── ItemCard ────────────────────────────────────────────────────────
function ItemCard({
  item,
  onToggle,
  onDelete,
  onEdit,
  dark = false,
  sCard = {},
  dimmed = false,
}: {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onEdit:   (item: ShoppingItem) => void;
  dark?: boolean;
  sCard?: React.CSSProperties;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl shadow-sm border px-4 py-3 flex items-center gap-3 transition-all ${dimmed ? "opacity-55" : ""}`}
      style={{ background: dark ? DK_CARD : "#fff", borderColor: dark ? DK_BORDER : "#f3f4f6", ...sCard }}
    >
      <button
        onClick={() => onToggle(item)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.is_purchased ? "bg-emerald-500 border-emerald-500 text-white" : ""
        }`}
        style={!item.is_purchased ? { borderColor: dark ? "#4a4a6a" : "#d1d5db" } : {}}
      >
        {item.is_purchased && <span className="text-xs font-bold">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-medium ${item.is_purchased ? "line-through" : ""}`}
            style={{ color: item.is_purchased ? (dark ? "#6b7280" : "#9ca3af") : (dark ? DK_TEXT : "#1f2937") }}
          >
            {item.name}
          </span>
          {item.quantity && (
            <span className="text-xs" style={{ color: dark ? "#6b7280" : "#9ca3af" }}>×{item.quantity}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {item.store && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STORE_COLORS[item.store] ?? "bg-gray-100 text-gray-600"}`}>
              {item.store}
            </span>
          )}
          {item.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] ?? "bg-gray-50 text-gray-500"}`}>
              {item.category}
            </span>
          )}
          {item.memo && (
            <span className="text-xs truncate max-w-[120px]" style={{ color: dark ? "#6b7280" : "#9ca3af" }}>
              💬 {item.memo}
            </span>
          )}
        </div>
      </div>

      {/* 修正②: 編集・削除ボタン */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="hover:text-blue-400 active:text-blue-500 transition-colors p-1 text-lg"
          style={{ color: dark ? "#4a4a6a" : "#d1d5db" }}
          title="編集"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="hover:text-red-400 active:text-red-500 transition-colors p-1 text-lg"
          style={{ color: dark ? "#4a4a6a" : "#d1d5db" }}
          title="削除"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────
function EmptyState({ message, dark = false }: { message: string; dark?: boolean }) {
  return (
    <div className="text-center py-16" style={{ color: dark ? "#4a4a6a" : "#9ca3af" }}>
      <div className="text-5xl mb-3">🛒</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
