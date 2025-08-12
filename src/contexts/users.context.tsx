'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { InterviewAssignee, CreateAssigneeRequest, UpdateAssigneeRequest, AssignInterviewRequest, UnassignInterviewRequest } from '@/types/user';
import { assigneeService } from '@/services/users.service';
import { useToast } from '@/components/ui/use-toast';

interface AssigneesContextType {
  assignees: InterviewAssignee[];
  assigneesLoading: boolean;
  refreshAssignees: () => Promise<void>;
  addAssignee: (assigneeData: CreateAssigneeRequest) => Promise<InterviewAssignee | null>;
  updateAssignee: (id: number, updateData: UpdateAssigneeRequest) => Promise<InterviewAssignee | null>;
  deleteAssignee: (id: number) => Promise<boolean>;
  assignInterview: (assignmentData: AssignInterviewRequest) => Promise<InterviewAssignee | null>;
  unassignInterview: (unassignData: UnassignInterviewRequest) => Promise<InterviewAssignee | null>;
  searchAssignees: (searchTerm: string) => Promise<InterviewAssignee[]>;
  getAssigneesByStatus: (status: 'active' | 'inactive' | 'pending') => Promise<InterviewAssignee[]>;
  getUnassignedAssignees: () => Promise<InterviewAssignee[]>;
}

const AssigneesContext = createContext<AssigneesContextType | undefined>(undefined);

export const useAssignees = () => {
  const context = useContext(AssigneesContext);
  if (context === undefined) {
    throw new Error('useAssignees must be used within an AssigneesProvider');
  }
  return context;
};

interface AssigneesProviderProps {
  children: ReactNode;
}

export const AssigneesProvider: React.FC<AssigneesProviderProps> = ({ children }) => {
  const [assignees, setAssignees] = useState<InterviewAssignee[]>([]);
  const [assigneesLoading, setAssigneesLoading] = useState(true);
  const { organization } = useOrganization();
  const { toast } = useToast();

  const refreshAssignees = async () => {
    if (!organization?.id) return;
    
    try {
      setAssigneesLoading(true);
      const data = await assigneeService.getAllAssignees(organization.id);
      setAssignees(data);
    } catch (error) {
      console.error('Error refreshing assignees:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh assignees',
        variant: 'destructive',
      });
    } finally {
      setAssigneesLoading(false);
    }
  };

  const addAssignee = async (assigneeData: CreateAssigneeRequest): Promise<InterviewAssignee | null> => {
    if (!organization?.id) return null;
    
    try {
      const newAssignee = await assigneeService.createAssignee({
        ...assigneeData,
        organization_id: organization.id,
      });
      
      setAssignees(prev => [newAssignee, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Assignee created successfully',
      });
      
      return newAssignee;
    } catch (error) {
      console.error('Error adding assignee:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignee',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAssignee = async (id: number, updateData: UpdateAssigneeRequest): Promise<InterviewAssignee | null> => {
    console.log("Updating assignee:", id, updateData);
    try {
      const updatedAssignee = await assigneeService.updateAssignee(id, updateData);
      
      setAssignees(prev => 
        prev.map(assignee => 
          assignee.id === id ? updatedAssignee : assignee
        )
      );
      
      toast({
        title: 'Success',
        description: 'Assignee updated successfully',
      });
      
      return updatedAssignee;
    } catch (error) {
      console.error('Error updating assignee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignee',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteAssignee = async (id: number): Promise<boolean> => {
    try {
      await assigneeService.deleteAssignee(id);
      
      setAssignees(prev => prev.filter(assignee => assignee.id !== id));
      
      toast({
        title: 'Success',
        description: 'Assignee deleted successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting assignee:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignee',
        variant: 'destructive',
      });
      return false;
    }
  };

  const assignInterview = async (assignmentData: AssignInterviewRequest): Promise<InterviewAssignee | null> => {
    try {
      const updatedAssignee = await assigneeService.assignInterview(assignmentData);
      
      setAssignees(prev => 
        prev.map(assignee => 
          assignee.id === assignmentData.assignee_id ? updatedAssignee : assignee
        )
      );
      
      toast({
        title: 'Success',
        description: 'Interview assigned successfully',
      });
      
      return updatedAssignee;
    } catch (error) {
      console.error('Error assigning interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign interview',
        variant: 'destructive',
      });
      return null;
    }
  };

  const unassignInterview = async (unassignData: UnassignInterviewRequest): Promise<InterviewAssignee | null> => {
    try {
      const updatedAssignee = await assigneeService.unassignInterview(unassignData);
      
      setAssignees(prev => 
        prev.map(assignee => 
          assignee.id === unassignData.assignee_id ? updatedAssignee : assignee
        )
      );
      
      toast({
        title: 'Success',
        description: 'Interview unassigned successfully',
      });
      
      return updatedAssignee;
    } catch (error) {
      console.error('Error unassigning interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign interview',
        variant: 'destructive',
      });
      return null;
    }
  };

  const searchAssignees = async (searchTerm: string): Promise<InterviewAssignee[]> => {
    if (!organization?.id) return [];
    
    try {
      return await assigneeService.searchAssignees(organization.id, searchTerm);
    } catch (error) {
      console.error('Error searching assignees:', error);
      return [];
    }
  };

  const getAssigneesByStatus = async (status: 'active' | 'inactive' | 'pending'): Promise<InterviewAssignee[]> => {
    if (!organization?.id) return [];
    
    try {
      return await assigneeService.getAssigneesByStatus(organization.id, status);
    } catch (error) {
      console.error('Error getting assignees by status:', error);
      return [];
    }
  };

  const getUnassignedAssignees = async (): Promise<InterviewAssignee[]> => {
    if (!organization?.id) return [];
    
    try {
      return await assigneeService.getUnassignedAssignees(organization.id);
    } catch (error) {
      console.error('Error getting unassigned assignees:', error);
      return [];
    }
  };

  useEffect(() => {
    if (organization?.id) {
      refreshAssignees();
    }
  }, [organization?.id]);

  const value: AssigneesContextType = {
    assignees,
    assigneesLoading,
    refreshAssignees,
    addAssignee,
    updateAssignee,
    deleteAssignee,
    assignInterview,
    unassignInterview,
    searchAssignees,
    getAssigneesByStatus,
    getUnassignedAssignees,
  };

  return (
    <AssigneesContext.Provider value={value}>
      {children}
    </AssigneesContext.Provider>
  );
};
