import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Direction } from "@/types/database";
import { RATES } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      club_name,
      direction,
      section_name,
      supervisor_name,
      period,
      rate,
      norm_capacity_people,
      actual_age_14_17,
      actual_age_18_35,
      norm_capacity_families,
      actual_families,
      norm_mso,
      mso_age_14_17,
      mso_age_18_35,
      notes,
    } = body;

    // Валидация направления
    const validDirections: Direction[] = ['КДН', 'ДПИ', 'Спортивное', 'Социальное', 'Патриотическое'];
    if (!validDirections.includes(direction)) {
      return NextResponse.json(
        { success: false, message: "Неверное направление" },
        { status: 400 }
      );
    }

    // Валидация ставки
    const rateNum = Number(rate);
    if (!RATES.includes(rateNum)) {
      return NextResponse.json(
        { success: false, message: "Неверная ставка (0, 0.25, 0.5, 0.75, 1)" },
        { status: 400 }
      );
    }

    // Валидация обязательных полей
    if (!club_name || !section_name || !period) {
      return NextResponse.json(
        { success: false, message: "Заполните обязательные поля" },
        { status: 400 }
      );
    }

    // Расчёт формул
    const actual_total_people = 
      Number(actual_age_14_17) + Number(actual_age_18_35);
    const mso_total = 
      Number(mso_age_14_17) + Number(mso_age_18_35);

    // Сохранение в БД
    const { data, error } = await supabase
      .from("reports")
      .insert({
        club_name,
        direction,
        section_name,
        supervisor_name,
        period,
        rate: rateNum,
        norm_capacity_people: Number(norm_capacity_people) || 0,
        actual_age_14_17: Number(actual_age_14_17) || 0,
        actual_age_18_35: Number(actual_age_18_35) || 0,
        actual_total_people,
        norm_capacity_families: Number(norm_capacity_families) || 0,
        actual_families: Number(actual_families) || 0,
        norm_mso: Number(norm_mso) || 0,
        mso_age_14_17: Number(mso_age_14_17) || 0,
        mso_age_18_35: Number(mso_age_18_35) || 0,
        mso_total,
        notes: notes || '',
        password: '',
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Данные сохранены",
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Submit error:", message);
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  }
}
