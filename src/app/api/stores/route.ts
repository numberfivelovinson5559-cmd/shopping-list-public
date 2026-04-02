import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ stores: data });
  } catch (err) {
    console.error("GET /api/stores:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "店舗名は必須です" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("stores")
      .insert({ name: body.name.trim(), sort_order: body.sort_order ?? 999 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ store: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stores:", err);
    return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 });
  }
}
