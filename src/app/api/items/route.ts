import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const filter = req.nextUrl.searchParams.get("filter") ?? "all";
    let query = supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "pending")   query = query.eq("is_purchased", false);
    if (filter === "purchased") query = query.eq("is_purchased", true);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch (err) {
    console.error("GET /api/items:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "商品名は必須です" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        name: body.name.trim(),
        store: body.store || null,
        category: body.category || null,
        quantity: body.quantity || null,
        memo: body.memo || null,
        is_purchased: false,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/items:", err);
    return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 });
  }
}
