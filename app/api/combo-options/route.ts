import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type DirectionOption = "КДН" | "ДПИ" | "Спортивное" | "Социальное" | "Патриотическое";

// GET: Получение опций для ComboBox
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") as "clubs" | "directions" | "sections" | "supervisors" | null;

    if (!type) {
      return NextResponse.json({ error: "type parameter is required" }, { status: 400 });
    }

    let data: (string | { name: string; supervisor: string })[] = [];

    switch (type) {
      case "clubs": {
        const result = await supabase.from("clubs").select("name").order("name");
        if (result.error) throw result.error;
        data = result.data?.map((c: { name: string }) => c.name) || [];
        break;
      }

      case "directions":
        data = ["КДН", "ДПИ", "Спортивное", "Социальное", "Патриотическое"];
        break;

      case "sections": {
        const directionParam = req.nextUrl.searchParams.get("direction");
        if (!directionParam) {
          return NextResponse.json({ error: "direction parameter is required" }, { status: 400 });
        }
        const result = await supabase
          .from("sections")
          .select("name, supervisor_name")
          .eq("direction", directionParam)
          .order("name");
        if (result.error) throw result.error;
        data = result.data?.map((s: { name: string; supervisor_name: string }) => ({
          name: s.name,
          supervisor: s.supervisor_name,
        })) || [];
        break;
      }

      case "supervisors": {
        const directionParam = req.nextUrl.searchParams.get("direction");
        if (!directionParam) {
          return NextResponse.json({ error: "direction parameter is required" }, { status: 400 });
        }
        const result = await supabase
          .from("sections")
          .select("supervisor_name")
          .eq("direction", directionParam);
        if (result.error) throw result.error;
        const uniqueSupervisors = [...new Set(result.data?.map((s: { supervisor_name: string }) => s.supervisor_name) || [])].filter(Boolean);
        data = uniqueSupervisors;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return NextResponse.json({ options: data });
  } catch (err) {
    console.error("Combo options error:", err);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}

// POST: Добавление новой опции
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, value, direction, supervisor } = body;

    if (!type || !value) {
      return NextResponse.json({ error: "type and value are required" }, { status: 400 });
    }

    let result: unknown;

    switch (type) {
      case "clubs": {
        const fetchResult = await supabase.from("clubs").select("id").eq("name", value).single();
        if (fetchResult.error && fetchResult.error.code !== "PGRST116") throw fetchResult.error;
        if (fetchResult.data) {
          return NextResponse.json({ error: "Club already exists" }, { status: 409 });
        }
        const insertResult = await supabase.from("clubs").insert([{ name: value }]).select();
        if (insertResult.error) throw insertResult.error;
        result = insertResult.data;
        break;
      }

      case "directions": {
        const validDirections = ["КДН", "ДПИ", "Спортивное", "Социальное", "Патриотическое"];
        if (!validDirections.includes(value)) {
          return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
        }
        result = [{ name: value }];
        break;
      }

      case "sections": {
        if (!direction) {
          return NextResponse.json({ error: "direction is required" }, { status: 400 });
        }
        const fetchResult = await supabase
          .from("sections")
          .select("id")
          .eq("name", value)
          .eq("direction", direction)
          .single();
        if (fetchResult.error && fetchResult.error.code !== "PGRST116") throw fetchResult.error;
        if (fetchResult.data) {
          return NextResponse.json({ error: "Section already exists" }, { status: 409 });
        }
        const insertResult = await supabase
          .from("sections")
          .insert([{ name: value, direction, supervisor_name: supervisor || "" }])
          .select();
        if (insertResult.error) throw insertResult.error;
        result = insertResult.data;
        break;
      }

      case "supervisors": {
        if (!direction) {
          return NextResponse.json({ error: "direction is required" }, { status: 400 });
        }
        const fetchResult = await supabase
          .from("sections")
          .select("id")
          .eq("supervisor_name", value)
          .eq("direction", direction)
          .single();
        if (fetchResult.error && fetchResult.error.code !== "PGRST116") throw fetchResult.error;
        if (fetchResult.data) {
          return NextResponse.json({ error: "Сотрудник уже существует" }, { status: 409 });
        }
        const insertResult = await supabase
          .from("sections")
          .insert([{ name: `${value}`, direction, supervisor_name: value }])
          .select();
        if (insertResult.error) throw insertResult.error;
        result = insertResult.data;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error("Combo create error:", err);
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}