import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { data, error } = await supabase
      .from("shopping_items")
      .update({ is_purchased: body.is_purchased })
      .eq("id", id)
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/items/[id]:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
