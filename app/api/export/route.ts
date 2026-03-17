import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Report } from "@/types/database";
import { utils, write } from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');

    if (!period) {
      return NextResponse.json({ error: "Укажите период" }, { status: 400 });
    }

    // Получаем данные за выбранный период
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq('period', period)
      .order("club_name", { ascending: true })
      .order("section_name", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Нет данных за выбранный период" }, { status: 404 });
    }

    const today = new Date().toLocaleDateString('ru-RU');

    // === ЛИСТ 1: Данные ===
    const sheet1Data: (string | number)[][] = [];

    // Заголовки (строки 1-2)
    sheet1Data.push([
      "№ п/п",
      `ФИО работника\nСведения на ${today}`,
      "Подразделение",
      "Название кружка, секции, клубного формирования",
      "Нагрузка",
      "Норма наполняемости",
      "Количество кружков",
      "Направление работы",
      "Количество занимающихся",
      "",
      "",
      "Примечание",
    ]);

    sheet1Data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "14-18 лет",
      "18-35 лет",
      "молодая семья",
      "",
    ]);

    // Данные
    let rowNum = 1;
    let totalRate = 0;
    let totalSections = 0;
    let totalAge14_17 = 0;
    let totalAge18_35 = 0;
    let totalFamilies = 0;

    data.forEach((row: Report) => {
      sheet1Data.push([
        rowNum++,
        row.supervisor_name,
        row.club_name,
        row.section_name,
        row.rate,
        row.norm_capacity_people,
        1,
        row.direction,
        row.actual_age_14_17,
        row.actual_age_18_35,
        row.actual_families,
        row.notes,
      ]);

      totalRate += row.rate;
      totalSections += 1;
      totalAge14_17 += row.actual_age_14_17;
      totalAge18_35 += row.actual_age_18_35;
      totalFamilies += row.actual_families;
    });

    // Итого
    sheet1Data.push([
      "Итого",
      "",
      "",
      "",
      totalRate,
      "",
      totalSections,
      "",
      totalAge14_17,
      totalAge18_35,
      totalFamilies,
      "",
    ]);

    // === ЛИСТ 2: Итоги по клубам ===
    interface ClubStats {
      total_sections: number;
      total_rate: number;
      total_norm_people: number;
      total_people: number;
      total_families: number;
      total_norm_mso: number;
      total_mso: number;
      notes: string;
    }

    const clubMap = new Map<string, ClubStats>();

    data.forEach((row: Report) => {
      if (!clubMap.has(row.club_name)) {
        clubMap.set(row.club_name, {
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
      club.total_rate += row.rate;
      club.total_norm_people += row.norm_capacity_people;
      club.total_people += row.actual_total_people;
      club.total_families += row.actual_families;
      club.total_norm_mso += row.norm_mso;
      club.total_mso += row.mso_total;
      if (row.notes) {
        club.notes = club.notes ? `${club.notes}; ${row.notes}` : row.notes;
      }
    });

    const sheet2Data: (string | number)[][] = [];

    // Заголовки
    sheet2Data.push([
      "№ п/п",
      "Название клуба",
      "Количество кружков",
      "Нагрузка (общая)",
      "Норма занимающихся (общая)",
      "Количество занимающихся",
      "Количество семей",
      "",
      "",
      "Норма МСО",
      "МСО фактическое",
      "Примечание",
    ]);

    // Данные (сортируем по названию клуба)
    const sortedClubs = Array.from(clubMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "ru")
    );

    let clubNum = 1;
    sortedClubs.forEach(([clubName, club]) => {
      sheet2Data.push([
        clubNum++,
        clubName,
        club.total_sections,
        club.total_rate,
        club.total_norm_people,
        club.total_people,
        club.total_families,
        "",
        "",
        club.total_norm_mso,
        club.total_mso,
        club.notes,
      ]);
    });

    // Создаём Excel файл
    const wb = utils.book_new();

    const ws1 = utils.aoa_to_sheet(sheet1Data);
    utils.book_append_sheet(wb, ws1, "Данные");

    const ws2 = utils.aoa_to_sheet(sheet2Data);
    utils.book_append_sheet(wb, ws2, "Итоги по клубам");

    // Генерируем буфер и отправляем как файл
    const excelBuffer = write(wb, { bookType: "xlsx", type: "array" });

    return new NextResponse(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="report_${period}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Export error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
