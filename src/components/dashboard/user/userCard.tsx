'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Phone, Calendar, UserCheck, UserX } from 'lucide-react';
import { InterviewAssignee } from '@/types/user';
import { useAssignees } from '@/contexts/users.context';
import { useToast } from '@/components/ui/use-toast';

interface AssigneeCardProps {
  assignee: InterviewAssignee;
  onEdit: (assignee: InterviewAssignee) => void;
  onViewDetails: (assignee: InterviewAssignee) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const AssigneeCard: React.FC<AssigneeCardProps> = ({ assignee, onEdit, onViewDetails }) => {
  const { deleteAssignee, assignInterview, unassignInterview } = useAssignees();
  const { toast } = useToast();

  const handleDelete = async () => {
    const success = await deleteAssignee(assignee.id);
    if (success) {
      toast({
        title: 'Success',
        description: 'Assignee deleted successfully',
      });
    }
  };

  const handleAssignInterview = async () => {
    // This would typically open a modal to select an interview
    // For now, we'll just show a toast
    toast({
      title: 'Info',
      description: 'Interview assignment feature will be implemented in the next step',
    });
  };

  const handleUnassignInterview = async () => {
    if (!assignee.interview_id) return;
    
    const success = await unassignInterview({
      assignee_id: assignee.id,
      assigned_by: 'current-user-id', // This should come from auth context
    });
    
    if (success) {
      toast({
        title: 'Success',
        description: 'Interview unassigned successfully',
      });
    }
  };

return (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={assignee.avatar_url}
              alt={`${assignee.first_name} ${assignee.last_name}`}
            />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(assignee.first_name, assignee.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">
              {assignee.first_name} {assignee.last_name}
            </h3>
            <p className="text-xs text-gray-500">{assignee.email}</p>
          </div>
        </div>

        {/* 🔘 Individual buttons replacing dropdown */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(assignee)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
    console.log('Edit clicked for:', assignee);
    onEdit(assignee);
  }}>
            Edit
          </Button>
          {/* {assignee.interview_id ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnassignInterview}
              className="text-red-500"
            >
              <UserX className="mr-1 h-4 w-4" />
              Unassign
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAssignInterview}
              className="text-green-600"
            >
              <UserCheck className="mr-1 h-4 w-4" />
              Assign
            </Button>
          )} */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-0">
      <div className="space-y-2">
        {assignee.phone && (
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="mr-2 h-3 w-3" />
            {assignee.phone}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${getStatusColor(assignee.status)}`}>
            {assignee.status}
          </Badge>

          {assignee.interview_id ? (
            <div className="flex items-center text-xs text-green-600">
              <UserCheck className="mr-1 h-3 w-3" />
              Assigned
            </div>
          ) : (
            <div className="flex items-center text-xs text-gray-500">
              <UserX className="mr-1 h-3 w-3" />
              Unassigned
            </div>
          )}
        </div>

        {assignee.assigned_at && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="mr-2 h-3 w-3" />
            Assigned: {new Date(assignee.assigned_at).toLocaleDateString()}
          </div>
        )}

        {assignee.notes && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
            {assignee.notes}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);


};
