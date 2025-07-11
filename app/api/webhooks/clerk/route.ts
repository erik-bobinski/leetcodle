import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { createServiceRoleClient } from "@/lib/supabase";
import type { User } from "@/lib/supabase";

export async function POST(req: Request) {
  console.log("🔔 Clerk webhook endpoint hit!");

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  console.log("📋 Headers received:", {
    svix_id: svix_id ? "present" : "missing",
    svix_timestamp: svix_timestamp ? "present" : "missing",
    svix_signature: svix_signature ? "present" : "missing"
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.log("❌ Missing required svix headers");
    return new Response("Error occured -- no svix headers", {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400
    });
  }

  const eventType = evt.type;

  console.log(`🎯 Processing webhook event: ${eventType}`);

  const supabase = createServiceRoleClient();

  if (eventType === "user.created") {
    const { id, email_addresses, username } = payload.data;

    console.log(`👤 User created event received for user ID: ${id}`);
    console.log(`📧 Email: ${email_addresses?.[0]?.email_address}`);
    console.log(`👤 Username: ${username}`);
    console.log(
      "Clerk webhook payload:",
      JSON.stringify(payload.data, null, 2)
    );

    // Insert into your 'users' table
    const { error } = await supabase.from("users").insert({
      user_id: id,
      email: email_addresses[0]?.email_address,
      username,
      theme: null,
      font_size: 14,
      tab_size: 2,
      line_numbers: true,
      vim_mode: false,
      language: "cpp"
    } as User);

    if (error) {
      console.error("Error inserting user into Supabase:", error);
      return new Response("Failed to insert user", { status: 500 });
    }

    console.log(`User created in Supabase with user_id: ${id}`);
    return new Response("User created", { status: 200 });
  } else if (eventType === "user.updated") {
    const {
      id,
      email_addresses,
      username,
      theme,
      font_size,
      tab_size,
      line_numbers,
      vim_mode,
      language
    } = payload.data;

    const { error } = await supabase
      .from("users")
      .update({
        email: email_addresses?.[0]?.email_address,
        username,
        theme,
        font_size,
        tab_size,
        line_numbers,
        vim_mode,
        language
      })
      .eq("user_id", id);

    if (error) {
      console.error("Error updating user in Supabase:", error);
      return new Response("Failed to update user", { status: 500 });
    }

    console.log(`User updated in Supabase: ${id}`);
    return new Response("User updated", { status: 200 });
  } else if (eventType === "user.deleted") {
    const { id } = payload.data;
    const { error } = await supabase.from("users").delete().eq("user_id", id);
    if (error) {
      console.error("Error deleting user from Supabase: ", error);
      return new Response("Error deleting user from Supabase", { status: 500 });
    }
    console.log("User deleted from Supabase: ", id);
    return new Response("User deleted", { status: 200 });
  }

  console.log(`⚠️ Unhandled event type: ${eventType}`);
  return new Response("Unhandled event type", { status: 500 });
}
