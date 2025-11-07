import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { UsersTable } from "@/drizzle/schema";
import { tryCatch } from "@/lib/try-catch";

export async function POST(req: Request) {
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

  const payload = await req.json();
  const body = JSON.stringify(payload);

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

  if (eventType === "user.created") {
    const { id, email_addresses, username } = payload.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error("No email address provided in user.created event");
      return new Response("No email address provided", { status: 400 });
    }

    // Check if a user with this email already exists
    const { data: existingUser, error: checkError } = await tryCatch(
      db
        .select({ user_id: UsersTable.user_id })
        .from(UsersTable)
        .where(eq(UsersTable.email, email))
        .limit(1)
    );

    if (checkError) {
      console.error("Error checking for existing user:", checkError);
      return new Response("Failed to check for existing user", { status: 500 });
    }

    if (existingUser && existingUser.length > 0) {
      console.log(
        `User with email ${email} already exists (user_id: ${existingUser[0].user_id}), skipping insertion`
      );
      return new Response("User already exists", { status: 200 });
    }

    const { error: insertError } = await tryCatch(
      db.insert(UsersTable).values({
        user_id: id,
        email,
        username,
        theme: null,
        font_size: 14,
        tab_size: 2,
        line_numbers: true,
        vim_mode: false,
        language: "cpp"
      })
    );
    if (insertError) {
      console.error("Error inserting user via Drizzle:", insertError);
      return new Response("Failed to insert user", { status: 500 });
    }

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

    const { error: updateError } = await tryCatch(
      db
        .update(UsersTable)
        .set({
          email: email_addresses?.[0]?.email_address,
          username,
          theme,
          font_size,
          tab_size,
          line_numbers,
          vim_mode,
          language
        })
        .where(eq(UsersTable.user_id, id))
    );
    if (updateError) {
      console.error("Error updating user via Drizzle:", updateError);
      return new Response("Failed to update user", { status: 500 });
    }

    return new Response("User updated", { status: 200 });
  } else if (eventType === "user.deleted") {
    const { id } = payload.data;
    const { error: deleteError } = await tryCatch(
      db.delete(UsersTable).where(eq(UsersTable.user_id, id))
    );
    if (deleteError) {
      console.error("Error deleting user via Drizzle:", deleteError);
      return new Response("Error deleting user", { status: 500 });
    }
    return new Response("User deleted", { status: 200 });
  }

  console.error(`⚠️ Unhandled event type: ${eventType}`);
  return new Response("Unhandled event type", { status: 500 });
}
