'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Mail, Phone, Calendar, UserCheck, UserX, Briefcase, ExternalLink, CheckSquare, Square, FileText, Clock, AlertTriangle } from 'lucide-react';
import { InterviewAssignee, ReviewStatus } from '@/types/user';
import { Interview } from '@/types/interview';
import { useAssignees } from '@/contexts/users.context';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface AssigneeCardProps {
  assignee: InterviewAssignee;
  onEdit: (assignee: InterviewAssignee) => void;
  onViewDetails: (assignee: InterviewAssignee) => void;
  interviews?: Interview[];
  hasGivenInterview?: boolean;
  callId?: string;
  interviewDate?: string;
  isSelected?: boolean;
  onSelect?: () => void;
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

export const AssigneeCard: React.FC<AssigneeCardProps> = ({ assignee, onEdit, onViewDetails, interviews = [], hasGivenInterview = false, callId, interviewDate, isSelected = false, onSelect }) => {
  const { deleteAssignee, assignInterview, unassignInterview } = useAssignees();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  
  const assignedInterview = interviews.find(i => i.id === assignee.interview_id);

  const handleDelete = async () => {
    const success = await deleteAssignee(assignee.id);
    if (success) {
      toast({
        title: 'Success',
        description: 'Assignee deleted successfully',
      });
      setDeleteConfirmOpen(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete assignee',
        variant: 'destructive',
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
  <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
    <CardHeader className="pb-3" style={{
      borderBottom: '3px solid #e0e0e0',
      marginBottom: '10px',
      outlineWidth: '5px',
      outlineColor: '#e0e0e0',
      marginTop: '10px',
    }}>
      <div className="flex items-center justify-between" >
        <div className="flex items-center space-x-3" >
          {onSelect && (
            <button
              onClick={onSelect}
              className="flex items-center mr-2"
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
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
          {hasGivenInterview && assignee.interview_id && callId && (
            <Link
              href={`/interviews/${assignee.interview_id}?call=${callId}`}
              target="_blank"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <ExternalLink className="h-3 w-3" />
                Interview
              </Button>
            </Link>
          )}
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
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <AlertDialogTitle>Delete Applicant</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="pt-2">
                  Are you sure you want to delete <strong>{assignee.first_name} {assignee.last_name}</strong>?
                  <br />
                  <span className="text-xs text-gray-500 mt-1 block">
                    This action cannot be undone. All associated data will be permanently deleted.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side - Interview Taken Date */}
        <div className="space-y-2">
          {assignee.phone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="mr-2 h-3 w-3" />
              {assignee.phone}
            </div>
          )}

          {assignee.applicant_id && (
            <div className="flex items-center text-xs text-gray-600">
              <FileText className="mr-2 h-3 w-3" />
              <span className="font-mono">ID: {assignee.applicant_id}</span>
            </div>
          )}

          {assignedInterview && (
            <div className="flex items-center text-xs text-gray-600">
              <Briefcase className="mr-2 h-3 w-3" />
              <span className="text-gray-600 mr-2">Assigned Interview:</span>
              <span className="font-medium text-blue-600"> {assignedInterview.name}</span>
            </div>
          )}

          {assignee.assigned_at && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="mr-2 h-3 w-3" />
              Assigned: {new Date(assignee.assigned_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
          )}

          {/* Interview Taken Date */}
          {interviewDate && (
            <div className="flex items-center text-xs font-medium text-gray-600">
              <Clock className="mr-2 h-4 w-4" />
              <span>Interview Taken: {interviewDate}</span>
            </div>
          )}
        </div>

        {/* Right Side - Tags and Statuses */}
        <div className="space-y-2 flex flex-col items-end md:items-start">
          <div className="flex flex-wrap gap-2 justify-end md:justify-start">
            {/* Assignee Status */}
            <Badge className={`text-xs ${getStatusColor(assignee.status)}`}>
              {assignee.status}
            </Badge>

            {/* Interview Assignment Status */}
            {assignee.interview_id ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                <UserCheck className="mr-1 h-3 w-3" />
                Assigned
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-300">
                <UserX className="mr-1 h-3 w-3" />
                Unassigned
              </Badge>
            )}

            {/* Review Status */}
            {assignee.review_status && assignee.review_status !== 'NO_STATUS' && (
              <>
                {assignee.review_status === 'NOT_SELECTED' && (
                  <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                    Not Selected
                  </Badge>
                )}
                {assignee.review_status === 'POTENTIAL' && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                    Potential
                  </Badge>
                )}
                {assignee.review_status === 'SELECTED' && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Selected
                  </Badge>
                )}
              </>
            )}

            {/* Tag */}
            {assignee.tag && (
              <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 bg-purple-50">
                {assignee.tag}
              </Badge>
            )}
          </div>

          {assignee.notes && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2 text-right md:text-left">
              {assignee.notes}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);


};
