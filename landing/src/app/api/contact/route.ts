import { NextResponse } from "next/server";

const MAX_PAYLOAD_BYTES = 100 * 1024;

class PayloadTooLargeError extends Error {}

async function parseJsonWithinLimit(request: Request) {
  if (!request.body) {
    return request.json();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        throw new PayloadTooLargeError("Contact request exceeds the payload limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const body = new TextDecoder().decode(bodyBytes);
  return JSON.parse(body);
}

export async function POST(request: Request) {
  try {
    // Protect against oversized payloads by checking content-length header
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload too large. Maximum size is 100KB.",
        },
        { status: 413 }
      );
    }

    const body = await parseJsonWithinLimit(request);
    const { name, email, subject, message } = body;

    // Validate presence of required fields first
    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, and message are required and cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Validate that inputs are strings
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      (subject !== undefined && typeof subject !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input types. Fields must be strings.",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const trimmedSubject = subject ? subject.trim() : "";

    // Validate trimmed fields are not empty
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, and message are required and cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format.",
        },
        { status: 400 }
      );
    }

    // Validate reasonable maximum character lengths
    if (trimmedName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Name cannot exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    if (trimmedEmail.length > 256) {
      return NextResponse.json(
        {
          success: false,
          error: "Email cannot exceed 256 characters.",
        },
        { status: 400 }
      );
    }

    if (trimmedSubject.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject cannot exceed 200 characters.",
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "Message cannot exceed 5000 characters.",
        },
        { status: 400 }
      );
    }

    console.info("[CONTACT_FORM] submission received", {
      hasSubject: Boolean(trimmedSubject),
      messageLength: trimmedMessage.length,
    });

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("[CONTACT_API] DISCORD_WEBHOOK_URL is not defined in environment variables.");
      return NextResponse.json(
        {
          success: false,
          error: "Backend contact configuration error. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    // Format rich embed for Discord (Cyan color theme matching Paraline branding)
    const discordPayload = {
      embeds: [
        {
          title: "📬 New Contact Form Submission",
          color: 58879, // #00e5ff in decimal
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: "Name",
              value: trimmedName,
              inline: true,
            },
            {
              name: "Email",
              value: trimmedEmail,
              inline: true,
            },
            {
              name: "Subject",
              value: trimmedSubject || "N/A",
              inline: false,
            },
            {
              name: "Message",
              value:
                trimmedMessage.length > 1024
                  ? trimmedMessage.substring(0, 1021) + "..."
                  : trimmedMessage,
              inline: false,
            },
          ],
          footer: {
            text: "Paraline Contact Bot",
          },
        },
      ],
    };

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("[CONTACT_API] Discord API response error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to dispatch message to notification endpoint.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message received and dispatched successfully.",
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload too large. Maximum size is 100KB.",
        },
        { status: 413 }
      );
    }

    console.error("[CONTACT_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Contact API Working",
  });
}
