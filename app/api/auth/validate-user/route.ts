import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if user exists in our database
    const { data, error } = await supabase
      .from("users")
      .select("user_id, email")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "User not found. Please check your credentials or sign up." },
        { status: 404 }
      );
    }

    // User exists in our database, allow sign-in
    return NextResponse.json(
      { message: "User validated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
