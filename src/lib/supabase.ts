import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ────────────────────────────────────────────────────────
export type ShoppingItem = {
  id: string;
  name: string;
  store: string | null;
  category: string | null;
  quantity: string | null;
  memo: string | null;
  is_purchased: boolean;
  created_at: string;
};

export type Store = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

// ─── Constants ───────────────────────────────────────────────────
export const DEFAULT_STORES = [
  "コストコ", "生協", "ダイソー", "セリア",
  "無印良品", "ロピア", "ツルハドラッグ", "業務スーパー",
] as const;

export const CATEGORIES = [
  "食品", "日用品", "衛生用品", "文房具", "衣類", "その他",
] as const;

export const STORE_COLORS: Record<string, string> = {
  コストコ: "bg-blue-100 text-blue-700",
  生協: "bg-green-100 text-green-700",
  ダイソー: "bg-yellow-100 text-yellow-700",
  セリア: "bg-pink-100 text-pink-700",
  無印良品: "bg-stone-100 text-stone-700",
  ロピア: "bg-orange-100 text-orange-700",
  ツルハドラッグ: "bg-purple-100 text-purple-700",
  業務スーパー: "bg-red-100 text-red-700",
};

export const CATEGORY_COLORS: Record<string, string> = {
  食品: "bg-green-50 text-green-600",
  日用品: "bg-blue-50 text-blue-600",
  衛生用品: "bg-purple-50 text-purple-600",
  文房具: "bg-yellow-50 text-yellow-600",
  衣類: "bg-pink-50 text-pink-600",
  その他: "bg-gray-50 text-gray-600",
};
