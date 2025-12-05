import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, interview_id } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required", avatar_url: null },
        { status: 400 }
      );
    }

    // First try to get assignee by email and interview_id
    let assignee = null;
    
    if (interview_id) {
      const { data } = await supabase
        .from('interview_assignee')
        .select('avatar_url, first_name, last_name')
        .eq('email', email.toLowerCase().trim())
        .eq('interview_id', interview_id)
        .single();
      
      assignee = data;
    }

    // If not found with interview_id, try just by email
    if (!assignee) {
      const { data } = await supabase
        .from('interview_assignee')
        .select('avatar_url, first_name, last_name')
        .eq('email', email.toLowerCase().trim())
        .limit(1)
        .single();
      
      assignee = data;
    }

    if (!assignee) {
      return NextResponse.json({
        error: "Assignee not found",
        avatar_url: null,
        name: null,
      });
    }

    return NextResponse.json({
      avatar_url: assignee.avatar_url || null,
      name: `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim(),
      has_photo: !!assignee.avatar_url,
    });
  } catch (error) {
    console.error("Error fetching assignee photo:", error);
    return NextResponse.json(
      { error: "Internal server error", avatar_url: null },
      { status: 500 }
    );
  }
}

