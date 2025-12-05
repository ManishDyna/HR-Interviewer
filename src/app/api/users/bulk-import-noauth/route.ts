import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkAssigneeImportRequest {
  users: Array<{
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    status?: string;
    notes?: string;
  }>;
  organization_id: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  imported: Array<any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkAssigneeImportRequest = await request.json();
    const { users: usersToImport, organization_id } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!usersToImport || !Array.isArray(usersToImport) || usersToImport.length === 0) {
      return NextResponse.json(
        { error: "Users array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Validate users array length
    if (usersToImport.length > 1000) {
      return NextResponse.json(
        { error: "Cannot import more than 1000 users at once" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      imported: [],
    };

    // Process each user
    for (let i = 0; i < usersToImport.length; i++) {
      const userData = usersToImport[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed

      try {
        // Validate required fields
        if (!userData.email || typeof userData.email !== 'string') {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email || 'N/A',
            error: "Email is required",
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: "Invalid email",
          });
          continue;
        }

        // Check if assignee already exists in the organization
        const { data: existingAssignee } = await supabase
          .from('interview_assignee')
          .select('id')
          .eq('email', userData.email)
          .eq('organization_id', organization_id)
          .single();
          
        if (existingAssignee) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: "User already exists",
          });
          continue;
        }

        // Validate first_name and last_name (required for interview_assignee)
        if (!userData.first_name || !userData.first_name.trim()) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: "First name missing",
          });
          continue;
        }

        if (!userData.last_name || !userData.last_name.trim()) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: "Last name missing",
          });
          continue;
        }

        // Validate status (TEXT field, not enum)
        const validStatuses = ['active', 'inactive', 'pending'];
        const status = userData.status?.toLowerCase() || 'active';
        if (!validStatuses.includes(status)) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: `Invalid status (use: active, inactive, pending)`,
          });
          continue;
        }

        // Create the assignee in interview_assignee table
        const insertData: any = {
          email: userData.email.trim().toLowerCase(),
          first_name: userData.first_name.trim(),
          last_name: userData.last_name.trim(),
          phone: userData.phone?.trim() || null,
          avatar_url: null,
          organization_id,
          status: status,
          notes: userData.notes?.trim() || null,
          // interview_id is NULL initially (can be assigned later)
          interview_id: null,
        };

        const { data: newAssignee, error: insertError } = await supabase
          .from('interview_assignee')
          .insert([insertData])
          .select()
          .single();

        if (insertError || !newAssignee) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: userData.email,
            error: insertError?.message || "Failed to create assignee",
          });
        } else {
          result.success++;
          result.imported.push(newAssignee);
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          email: userData.email || 'N/A',
          error: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    return NextResponse.json(
      {
        message: `Bulk import completed. Success: ${result.success}, Failed: ${result.failed}`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error in POST /api/users/bulk-import-noauth:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

