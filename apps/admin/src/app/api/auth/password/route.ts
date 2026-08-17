import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { newPassword } = await request.json();

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { message: error.body?.message ?? error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ message: "No se pudo establecer la contraseña" }, { status: 500 });
  }
}
