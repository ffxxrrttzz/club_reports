import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") as
      | "clubs"
      | "directions"
      | "sections"
      | null;

    if (!type) {
      return NextResponse.json(
        { error: "type parameter is required" },
        { status: 400 }
      );
    }

    let data: any[] = [];

    switch (type) {
      case "clubs":
        const { data: clubs } = await supabase
          .from("clubs")
          .select("name")
          .order("name");
        data = clubs?.map((c) => c.name) || [];
        break;

      case "directions":
        const { data: directions } = await supabase
          .from("directions")
          .select("name")
          .order("name");
        data = directions?.map((d) => d.name) || [];
        break;

      case "sections":
        const directionParam = req.nextUrl.searchParams.get("direction");
        if (!directionParam) {
          return NextResponse.json(
            { error: "direction parameter is required for sections" },
            { status: 400 }
          );
        }
        const { data: sections } = await supabase
          .from("sections")
          .select("name, supervisor")
          .eq("direction", directionParam)
          .order("name");
        data =
          sections?.map((s) => ({
            name: s.name,
            supervisor: s.supervisor,
          })) || [];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({ options: data });
  } catch (err) {
    console.error("Combo options error:", err);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, value, direction, supervisor } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: "type and value are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "clubs":
        const { data: existingClub } = await supabase
          .from("clubs")
          .select("id")
          .eq("name", value)
          .single();

        if (existingClub) {
          return NextResponse.json(
            { error: "Club already exists" },
            { status: 409 }
          );
        }

        const { data: newClub, error: clubError } = await supabase
          .from("clubs")
          .insert([{ name: value }])
          .select();

        if (clubError) throw clubError;
        result = newClub;
        break;

      case "directions":
        const { data: existingDir } = await supabase
          .from("directions")
          .select("id")
          .eq("name", value)
          .single();

        if (existingDir) {
          return NextResponse.json(
            { error: "Direction already exists" },
            { status: 409 }
          );
        }

        const { data: newDir, error: dirError } = await supabase
          .from("directions")
          .insert([{ name: value }])
          .select();

        if (dirError) throw dirError;
        result = newDir;
        break;

      case "sections":
        if (!direction) {
          return NextResponse.json(
            { error: "direction is required for sections" },
            { status: 400 }
          );
        }

        const { data: existingSec } = await supabase
          .from("sections")
          .select("id")
          .eq("name", value)
          .eq("direction", direction)
          .single();

        if (existingSec) {
          return NextResponse.json(
            { error: "Section already exists" },
            { status: 409 }
          );
        }

        const { data: newSec, error: secError } = await supabase
          .from("sections")
          .insert([{ name: value, direction, supervisor: supervisor || "" }])
          .select();

        if (secError) throw secError;
        result = newSec;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error("Combo create error:", err);
    return NextResponse.json(
      { error: "Failed to create option" },
      { status: 500 }
    );
  }
}
