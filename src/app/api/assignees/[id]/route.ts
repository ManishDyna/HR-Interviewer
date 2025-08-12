import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { assigneeService } from '@/services/users.service';
import { UpdateAssigneeRequest } from '@/types/user';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assigneeId = parseInt(params.id);
    if (isNaN(assigneeId)) {
      return NextResponse.json({ error: 'Invalid assignee ID' }, { status: 400 });
    }

    const assignee = await assigneeService.getAssigneeById(assigneeId);
    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    return NextResponse.json(assignee);
  } catch (error) {
    logger.error('Error in GET /api/assignees/[id]:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assigneeId = parseInt(params.id);
    if (isNaN(assigneeId)) {
      return NextResponse.json({ error: 'Invalid assignee ID' }, { status: 400 });
    }

    const body: UpdateAssigneeRequest = await request.json();
    
    // Check if assignee exists
    const existingAssignee = await assigneeService.getAssigneeById(assigneeId);
    if (!existingAssignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    // If email is being updated, check for duplicates
    if (body.email && body.email !== existingAssignee.email) {
      const duplicateAssignee = await assigneeService.getAssigneeByEmail(body.email, existingAssignee.organization_id);
      if (duplicateAssignee && duplicateAssignee.id !== assigneeId) {
        return NextResponse.json(
          { error: 'An assignee with this email already exists in this organization' },
          { status: 409 }
        );
      }
    }

    const updatedAssignee = await assigneeService.updateAssignee(assigneeId, body);
    
    return NextResponse.json(updatedAssignee);
  } catch (error) {
    logger.error('Error in PUT /api/assignees/[id]:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assigneeId = parseInt(params.id);
    if (isNaN(assigneeId)) {
      return NextResponse.json({ error: 'Invalid assignee ID' }, { status: 400 });
    }

    // Check if assignee exists
    const existingAssignee = await assigneeService.getAssigneeById(assigneeId);
    if (!existingAssignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    await assigneeService.deleteAssignee(assigneeId);
    
    return NextResponse.json({ message: 'Assignee deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /api/assignees/[id]:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
