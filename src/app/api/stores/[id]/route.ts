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
      .from("stores")
      .update({ sort_order: body.sort_order })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ store: data });
  } catch (err) {
    console.error("PATCH /api/stores/[id]:", err);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/stores/[id]:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
