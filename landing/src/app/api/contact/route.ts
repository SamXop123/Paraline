import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields.",
        },
        { status: 400 }
      );
    }

   console.info("[CONTACT_FORM] submission received", {
  hasSubject: Boolean(subject),
  messageLength: message.length,
});
    return NextResponse.json({
      success: true,
      message: "Message received successfully.",
    });
  } catch (error) {
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