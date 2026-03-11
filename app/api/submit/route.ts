import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { club_name, report_date, visitors, revenue, password } = body;

    // Простая проверка пароля
    if (password !== "club2024") {
      return NextResponse.json(
        { success: false, message: "Неверный пароль" },
        { status: 401 }
      );
    }

    // Валидация
    if (!club_name || !report_date || visitors < 0 || revenue < 0) {
      return NextResponse.json(
        { success: false, message: "Некорректные данные" },
        { status: 400 }
      );
    }

    // Сохранение в БД
    const { data, error } = await supabase
      .from("reports")
      .insert({
        club_name,
        report_date,
        visitors: Number(visitors),
        revenue: Number(revenue),
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
