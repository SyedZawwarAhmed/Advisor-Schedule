import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { z } from "zod";

// Schema for email settings
const emailSettingsSchema = z.object({
  emailHost: z.string().min(1, "Email host is required"),
  emailPort: z.number().int().min(1).max(65535),
  emailSecure: z.boolean(),
  emailUsername: z.string().email("Invalid email username"),
  emailPassword: z.string().min(1, "Email password is required"),
  emailFrom: z.string().email("Invalid from email address"),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailHost: true,
        emailPort: true,
        emailSecure: true,
        emailUsername: true,
        emailFrom: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = emailSettingsSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        emailHost: true,
        emailPort: true,
        emailSecure: true,
        emailUsername: true,
        emailFrom: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email settings", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update email settings" },
      { status: 500 }
    );
  }
} 