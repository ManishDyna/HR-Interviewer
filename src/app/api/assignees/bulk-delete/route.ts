import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkDeleteRequest {
  assignee_ids: number[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkDeleteRequest = await request.json();
    const { assignee_ids } = body;

    if (!assignee_ids || !Array.isArray(assignee_ids) || assignee_ids.length === 0) {
      return NextResponse.json(
        { error: "Assignee IDs are required" },
        { status: 400 }
      );
    }

    // Delete all selected assignees
    const { data, error } = await supabase
      .from('interview_assignee')
      .delete()
      .in('id', assignee_ids)
      .select();

    if (error) {
      console.error('Error deleting assignees:', error);
      return NextResponse.json(
        { error: "Failed to delete assignees" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully deleted ${data.length} assignee(s)`,
        deleted: data.length,
        assignees: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/assignees/bulk-delete:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

