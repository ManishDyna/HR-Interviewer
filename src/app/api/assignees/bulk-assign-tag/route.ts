import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkTagAssignmentRequest {
  assignee_ids: number[];
  tag: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkTagAssignmentRequest = await request.json();
    const { assignee_ids, tag } = body;

    if (!assignee_ids || !Array.isArray(assignee_ids) || assignee_ids.length === 0) {
      return NextResponse.json(
        { error: "Assignee IDs are required" },
        { status: 400 }
      );
    }

    // Update tag for all selected assignees
    const { data, error } = await supabase
      .from('interview_assignee')
      .update({ tag: tag || null })
      .in('id', assignee_ids)
      .select();

    if (error) {
      console.error('Error assigning tag:', error);
      return NextResponse.json(
        { error: "Failed to assign tag" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: tag
          ? `Successfully assigned tag to ${data.length} assignee(s)`
          : `Successfully removed tag from ${data.length} assignee(s)`,
        updated: data.length,
        assignees: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/assignees/bulk-assign-tag:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

