import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { assigneeService } from '@/services/users.service';
import { CreateAssigneeRequest } from '@/types/user';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending' | null;

    let assignees;
    if (search) {
      assignees = await assigneeService.searchAssignees(organizationId || undefined, search);
    } else if (status) {
      assignees = await assigneeService.getAssigneesByStatus(organizationId || undefined, status);
    } else {
      assignees = await assigneeService.getAllAssignees(organizationId || undefined);
    }

    return NextResponse.json(assignees);
  } catch (error) {
    logger.error('Error in GET /api/assignees:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateAssigneeRequest = await request.json();
    
    // Validate required fields (organization_id is now optional)
    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if assignee already exists with this email
    const existingAssignee = await assigneeService.getAssigneeByEmail(body.email, body.organization_id || undefined);
    if (existingAssignee) {
      return NextResponse.json(
        { error: 'An assignee with this email already exists' },
        { status: 409 }
      );
    }

    const assignee = await assigneeService.createAssignee(body);
    
    return NextResponse.json(assignee, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/assignees:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
