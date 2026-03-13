import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Report, ClubSummary } from "@/types/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');

    let query = supabase.from("reports").select("*");

    // Фильтр по периоду (если указан)
    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Агрегация по клубам
    const clubMap = new Map<string, ClubSummary>();

    (data || []).forEach((row: Report) => {
      if (!clubMap.has(row.club_name)) {
        clubMap.set(row.club_name, {
          club_name: row.club_name,
          total_sections: 0,
          total_rate: 0,
          total_norm_people: 0,
          total_people: 0,
          total_families: 0,
          total_norm_mso: 0,
          total_mso: 0,
          notes: '',
        });
      }

      const club = clubMap.get(row.club_name)!;
      club.total_sections += 1;
      club.total_rate += Number(row.rate);
      club.total_norm_people += Number(row.norm_capacity_people);
      club.total_people += Number(row.actual_total_people);
      club.total_families += Number(row.actual_families);
      club.total_norm_mso += Number(row.norm_mso);
      club.total_mso += Number(row.mso_total);
      
      if (row.notes) {
        club.notes = club.notes ? `${club.notes}; ${row.notes}` : row.notes;
      }
    });

    const summary = Array.from(clubMap.values());

    return NextResponse.json({ raw: data || [], summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Report error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}