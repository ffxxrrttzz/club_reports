import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password (basic implementation - use bcryptjs in production)
    const salt = randomBytes(16).toString("hex");
    const hash = createHash("sha256");
    hash.update(password + salt);
    const passwordHash = hash.digest("hex");
    const fullPasswordHash = `${salt}:${passwordHash}`;

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: fullPasswordHash,
          full_name: fullName,
          role: "manager",
        },
      ])
      .select();

    if (createError) {
      console.error("User creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Return user info (without password hash)
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser?.[0]?.id,
          email: newUser?.[0]?.email,
          fullName: newUser?.[0]?.full_name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
