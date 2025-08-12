import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { assigneeService } from '@/services/users.service';
import { AssignInterviewRequest, UnassignInterviewRequest } from '@/types/user';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AssignInterviewRequest = await request.json();
    
    // Validate required fields
    if (!body.assignee_id || !body.interview_id || !body.assigned_by) {
      return NextResponse.json(
        { error: 'Assignee ID, interview ID, and assigned by are required' },
        { status: 400 }
      );
    }

    // Check if assignee exists
    const assignee = await assigneeService.getAssigneeById(body.assignee_id);
    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    // Check if assignee is already assigned to an interview
    if (assignee.interview_id) {
      return NextResponse.json(
        { error: 'Assignee is already assigned to an interview' },
        { status: 409 }
      );
    }

    const updatedAssignee = await assigneeService.assignInterview(body);
    
    return NextResponse.json(updatedAssignee);
  } catch (error) {
    logger.error('Error in POST /api/assignees/assign-interview:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UnassignInterviewRequest = await request.json();
    
    // Validate required fields
    if (!body.assignee_id || !body.assigned_by) {
      return NextResponse.json(
        { error: 'Assignee ID and assigned by are required' },
        { status: 400 }
      );
    }

    // Check if assignee exists
    const assignee = await assigneeService.getAssigneeById(body.assignee_id);
    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    // Check if assignee is assigned to an interview
    if (!assignee.interview_id) {
      return NextResponse.json(
        { error: 'Assignee is not assigned to any interview' },
        { status: 409 }
      );
    }

    const updatedAssignee = await assigneeService.unassignInterview(body);
    
    return NextResponse.json(updatedAssignee);
  } catch (error) {
    logger.error('Error in DELETE /api/assignees/assign-interview:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
