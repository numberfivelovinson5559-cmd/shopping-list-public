import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
    }

    const body = await req.json();
    const updateFields: Record<string, unknown> = {};
    if (body.is_purchased !== undefined) updateFields.is_purchased = body.is_purchased;
    if (body.name        !== undefined) updateFields.name         = body.name;
    if (body.category    !== undefined) updateFields.category     = body.category || null;
    if (body.store       !== undefined) updateFields.store        = body.store    || null;
    if (body.quantity    !== undefined) updateFields.quantity     = body.quantity || null;
    if (body.memo        !== undefined) updateFields.memo         = body.memo     || null;

    const { data, error } = await supabase
      .from("shopping_items")
      .update(updateFields)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("PATCH /api/items/[id]:", err);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
    }

    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/items/[id]:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
