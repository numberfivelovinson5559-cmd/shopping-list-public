import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 店舗名の一括更新（リネームまたは削除時に使用）
// body: { oldStore: string, newStore: string | null }
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
    }
    const { oldStore, newStore } = await req.json();
    if (!oldStore) {
      return NextResponse.json({ error: "oldStoreは必須です" }, { status: 400 });
    }
    const { error } = await supabase
      .from("shopping_items")
      .update({ store: newStore ?? null })
      .eq("user_id", userId)
      .eq("store", oldStore);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/items/bulk-store:", err);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
