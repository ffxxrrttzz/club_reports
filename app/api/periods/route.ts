import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Получаем все уникальные периоды из базы, сортируем по убыванию
    const { data, error } = await supabase
      .from("reports")
      .select("period")
      .order("period", { ascending: false });

    if (error) throw error;

    // Извлекаем уникальные периоды
    const uniquePeriods = [...new Set(data?.map(row => row.period) || [])].sort().reverse();

    return NextResponse.json({ periods: uniquePeriods });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Periods error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}