import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // In a more sophisticated setup, you'd invalidate the token in a database
  // For now, the client just removes the token from localStorage
  return NextResponse.json({ success: true });
}

