export type AssigneeStatus = 'active' | 'inactive' | 'pending';
export type UserRole = 'admin' | 'manager' | 'interviewer' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ReviewStatus = 'NO_STATUS' | 'NOT_SELECTED' | 'POTENTIAL' | 'SELECTED';

export interface ClientUser {
  id: string;
  created_at: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  organization_id: string;
  role: UserRole;
  status: UserStatus;
  last_login?: string;
  created_by?: string;
  updated_at: string;
}

export interface InterviewAssignee {
  id: number;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  organization_id?: string | null;
  interview_id?: string | null;
  status: AssigneeStatus;
  assigned_by?: string;
  assigned_at?: string;
  notes?: string;
  tag?: string | null;
  applicant_id?: string | null;
  review_status?: ReviewStatus | null;
}

export interface CreateAssigneeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  organization_id?: string | null;
  interview_id?: string | null;
  status?: AssigneeStatus;
  notes?: string;
  tag?: string | null;
  applicant_id?: string | null;
  review_status?: ReviewStatus | null;
}

export interface UpdateAssigneeRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  interview_id?: string | null;
  status?: AssigneeStatus;
  notes?: string;
  tag?: string | null;
  applicant_id?: string | null;
  review_status?: ReviewStatus | null;
}

export interface AssignInterviewRequest {
  assignee_id: number;
  interview_id: string;
  assigned_by: string;
  notes?: string;
}

export interface UnassignInterviewRequest {
  assignee_id: number;
  assigned_by: string;
}
