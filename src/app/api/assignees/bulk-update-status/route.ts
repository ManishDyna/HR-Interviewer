import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkStatusUpdateRequest {
  assignee_ids: number[];
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkStatusUpdateRequest = await request.json();
    const { assignee_ids, status } = body;

    if (!assignee_ids || !Array.isArray(assignee_ids) || assignee_ids.length === 0) {
      return NextResponse.json(
        { error: "Assignee IDs are required" },
        { status: 400 }
      );
    }

    if (!status || !['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (active, inactive, or pending)" },
        { status: 400 }
      );
    }

    // Update status for all selected assignees
    const { data, error } = await supabase
      .from('interview_assignee')
      .update({ status })
      .in('id', assignee_ids)
      .select();

    if (error) {
      console.error('Error updating status:', error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully updated status for ${data.length} assignee(s)`,
        updated: data.length,
        assignees: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/assignees/bulk-update-status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

