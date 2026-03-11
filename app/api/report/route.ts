import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Report, SummaryData } from "@/types/database";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false });

    if (error) throw error;

    // Агрегация по клубам
    const summary = (data || []).reduce((acc: SummaryData, curr: Report) => {
      if (!acc[curr.club_name]) {
        acc[curr.club_name] = { visitors: 0, revenue: 0 };
      }
      acc[curr.club_name].visitors += Number(curr.visitors);
      acc[curr.club_name].revenue += Number(curr.revenue);
      return acc;
    }, {});

    return NextResponse.json({ raw: data || [], summary });
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Report error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
