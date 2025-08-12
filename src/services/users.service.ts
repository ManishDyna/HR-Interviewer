import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { InterviewAssignee, CreateAssigneeRequest, UpdateAssigneeRequest, AssignInterviewRequest, UnassignInterviewRequest } from '@/types/user';
import { logger } from '@/lib/logger';

const supabase = createClientComponentClient();

export const assigneeService = {
  // Get all assignees for an organization
  async getAllAssignees(organizationId: string): Promise<InterviewAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

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

  // Get assignee by email
  async getAssigneeByEmail(email: string, organizationId: string): Promise<InterviewAssignee | null> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching assignee by email:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Create new assignee
  async createAssignee(assigneeData: CreateAssigneeRequest): Promise<InterviewAssignee> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .insert([assigneeData])
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

  // Search assignees
  async searchAssignees(organizationId: string, searchTerm: string): Promise<InterviewAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error searching assignees:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get assignees by status
  async getAssigneesByStatus(organizationId: string, status: 'active' | 'inactive' | 'pending'): Promise<InterviewAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching assignees by status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  // Get unassigned assignees (no interview_id)
  async getUnassignedAssignees(organizationId: string): Promise<InterviewAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('interview_assignee')
        .select('*')
        .eq('organization_id', organizationId)
        .is('interview_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching unassigned assignees:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
};
