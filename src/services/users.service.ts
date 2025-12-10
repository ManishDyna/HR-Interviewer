import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { nanoid } from 'nanoid';
import { InterviewAssignee, CreateAssigneeRequest, UpdateAssigneeRequest, AssignInterviewRequest, UnassignInterviewRequest, ClientUser, UserRole, UserStatus } from '@/types/user';
import { logger } from '@/lib/logger';

const supabase = createClientComponentClient();

export const assigneeService = {
  // Get all assignees - optionally filter by organization_id
  async getAllAssignees(organizationId?: string | null): Promise<InterviewAssignee[]> {
    try {
      let query = supabase
        .from('interview_assignee')
        .select('*')
        .order('created_at', { ascending: false });

      // Only filter by organization_id if it's provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      // If no organization_id, get ALL assignees (don't filter)

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching assignees:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignee by ID
  async getAssigneeById(id: number): Promise<InterviewAssignee | null> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching assignee:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignee by email - optionally filter by organization_id
  async getAssigneeByEmail(email: string, organizationId?: string | null): Promise<InterviewAssignee | null> {
    try {
      let query = supabase
        .from('interview_assignee')
        .select('*')
        .eq('email', email);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      return data || null;
    } catch (error) {
      logger.error('Error fetching assignee by email:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Create new assignee
  async createAssignee(assigneeData: CreateAssigneeRequest): Promise<InterviewAssignee> {
    try {
      // Remove organization_id if it's an empty string
      // Don't include applicant_id - let database trigger auto-generate it
      const dataToInsert = {
        ...assigneeData,
        organization_id: assigneeData.organization_id || null,
        applicant_id: undefined, // Let database auto-generate
      };

      // Remove applicant_id from dataToInsert if it's explicitly set to null/empty
      // The database trigger will generate it automatically
      if (dataToInsert.applicant_id === null || dataToInsert.applicant_id === '') {
        delete (dataToInsert as any).applicant_id;
      }

      const { data, error } = await supabase
        .from('interview_assignee')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating assignee:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Update assignee
  async updateAssignee(id: number, updateData: UpdateAssigneeRequest): Promise<InterviewAssignee> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating assignee:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Delete assignee
  async deleteAssignee(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('interview_assignee')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting assignee:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Update assignee status
  async updateAssigneeStatus(id: number, status: 'active' | 'inactive' | 'pending'): Promise<InterviewAssignee> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating assignee status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Assign interview to assignee
  async assignInterview(assignmentData: AssignInterviewRequest): Promise<InterviewAssignee> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .update({
          interview_id: assignmentData.interview_id,
          assigned_by: assignmentData.assigned_by,
          assigned_at: new Date().toISOString(),
          notes: assignmentData.notes
        })
        .eq('id', assignmentData.assignee_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error assigning interview:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Unassign interview from assignee
  async unassignInterview(unassignData: UnassignInterviewRequest): Promise<InterviewAssignee> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .update({
          interview_id: null,
          assigned_by: unassignData.assigned_by,
          assigned_at: null,
          notes: null
        })
        .eq('id', unassignData.assignee_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error unassigning interview:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignees by interview ID
  async getAssigneesByInterview(interviewId: string): Promise<InterviewAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('interview_id', interviewId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching assignees by interview:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Search assignees - optionally filter by organization_id
  async searchAssignees(organizationId: string | null | undefined, searchTerm: string): Promise<InterviewAssignee[]> {
    try {
      let query = supabase
        .from('interview_assignee')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      // If no organization_id, get ALL matching assignees

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error searching assignees:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignees by status - optionally filter by organization_id
  async getAssigneesByStatus(organizationId: string | null | undefined, status: 'active' | 'inactive' | 'pending'): Promise<InterviewAssignee[]> {
    try {
      let query = supabase
        .from('interview_assignee')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      // If no organization_id, get ALL assignees with this status

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching assignees by status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get unassigned assignees (no interview_id) - optionally filter by organization_id
  async getUnassignedAssignees(organizationId: string | null | undefined): Promise<InterviewAssignee[]> {
    try {
      let query = supabase
        .from('interview_assignee')
        .select('*')
        .is('interview_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      // If no organization_id, get ALL unassigned assignees

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching unassigned assignees:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Update assignee review status by email and interview_id
  async updateAssigneeReviewStatus(
    email: string,
    interviewId: string,
    reviewStatus: 'NO_STATUS' | 'NOT_SELECTED' | 'POTENTIAL' | 'SELECTED'
  ): Promise<InterviewAssignee | null> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .update({ review_status: reviewStatus })
        .eq('email', email)
        .eq('interview_id', interviewId)
        .select()
        .single();

      if (error) {
        // If no assignee found, that's okay - just return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('Error updating assignee review status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignee by email and interview_id
  async getAssigneeByEmailAndInterview(
    email: string,
    interviewId: string
  ): Promise<InterviewAssignee | null> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('email', email)
        .eq('interview_id', interviewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('Error getting assignee by email and interview:', error instanceof Error ? error.message : String(error));
      return null;
    }
  },
};

// User Service for managing users in the "user" table
export const createUser = async (
  userData: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    organization_id: string;
    role: UserRole;
    status: UserStatus;
  },
  createdBy: string
): Promise<ClientUser | null> => {
  try {
    const userId = nanoid(); // Generate unique ID
    const { data, error } = await supabase
      .from('user')
      .insert([
        {
          id: userId, // Explicitly provide the ID
          ...userData,
          created_by: createdBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating user:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<ClientUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // If no user found, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Error fetching user by email:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const getUserById = async (userId: string): Promise<ClientUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Error fetching user by ID:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const getAllUsers = async (organizationId: string): Promise<ClientUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching all users:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const getUsersByRole = async (organizationId: string, role: string): Promise<ClientUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching users by role:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const getUsersByStatus = async (organizationId: string, status: string): Promise<ClientUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching users by status:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const searchUsers = async (organizationId: string, searchTerm: string): Promise<ClientUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error searching users:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    role?: UserRole;
    status?: UserStatus;
  }
): Promise<ClientUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating user:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error deleting user:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const logUserActivity = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_activity_log')
      .insert([
        {
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
        },
      ]);

    if (error) throw error;
  } catch (error) {
    logger.error('Error logging user activity:', error instanceof Error ? error.message : String(error));
    // Don't throw, just log the error - activity logging shouldn't break the main flow
  }
};
