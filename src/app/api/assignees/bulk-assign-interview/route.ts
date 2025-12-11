import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkInterviewAssignmentRequest {
  assignee_ids: number[];
  interview_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkInterviewAssignmentRequest = await request.json();
    const { assignee_ids, interview_id } = body;

    if (!assignee_ids || !Array.isArray(assignee_ids) || assignee_ids.length === 0) {
      return NextResponse.json(
        { error: "Assignee IDs are required" },
        { status: 400 }
      );
    }

    // Update interview_id for all selected assignees
    const { data, error } = await supabase
      .from('interview_assignee')
      .update({ interview_id: interview_id || null })
      .in('id', assignee_ids)
      .select();

    if (error) {
      console.error('Error assigning interview:', error);
      return NextResponse.json(
        { error: "Failed to assign interview" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: interview_id
          ? `Successfully assigned interview to ${data.length} assignee(s)`
          : `Successfully removed interview from ${data.length} assignee(s)`,
        updated: data.length,
        assignees: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/assignees/bulk-assign-interview:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

