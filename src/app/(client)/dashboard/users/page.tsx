'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Grid3X3, List, Users, UserCheck, UserX, Briefcase, Upload, Download, Tag, ExternalLink, Trash2, Mail, CheckSquare, Square, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAssignees } from '@/contexts/users.context';
import { useInterviews } from '@/contexts/interviews.context';
import { AssigneeCard } from '@/components/dashboard/user/userCard';
import { CreateAssigneeModal } from '@/components/dashboard/user/createUserModal';
import { BulkImportModal } from '@/components/dashboard/user/bulkImportModal';
import { InterviewAssignee } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ResponseService } from '@/services/responses.service';
import { useToast } from '@/components/ui/use-toast';

export default function AssigneesPage() {
  const { assignees, assigneesLoading, refreshAssignees, searchAssignees, getAssigneesByStatus, deleteAssignee } = useAssignees();
  const { interviews, interviewsLoading } = useInterviews();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [interviewFilter, setInterviewFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const setCreateModalOpen = (val: boolean) => {
    setIsCreateModalOpen(val);
  };
  const [selectedAssignee, setSelectedAssignee] = useState<InterviewAssignee | null>(null);
  const [filteredAssignees, setFilteredAssignees] = useState<InterviewAssignee[]>([]);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [assigneesWithResponses, setAssigneesWithResponses] = useState<Set<string>>(new Set());
  const [assigneeCallIds, setAssigneeCallIds] = useState<Map<string, string>>(new Map()); // email -> call_id mapping
  const [assigneeInterviewDates, setAssigneeInterviewDates] = useState<Map<string, string>>(new Map()); // email -> interview_date mapping
  const [selectedAssignees, setSelectedAssignees] = useState<Set<number>>(new Set());
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAssignee, setViewAssignee] = useState<InterviewAssignee | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assigneeToDelete, setAssigneeToDelete] = useState<InterviewAssignee | null>(null);

  // Listen for review status updates from interview details page
  React.useEffect(() => {
    const handleReviewStatusUpdate = () => {
      // Refresh assignees when review status is updated
      refreshAssignees();
    };

    window.addEventListener('assigneeReviewStatusUpdated', handleReviewStatusUpdate);
    
    // Also refresh when window gains focus (user comes back from interview details)
    const handleFocus = () => {
      refreshAssignees();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('assigneeReviewStatusUpdated', handleReviewStatusUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAssignees]);

  // Check which assignees have given interviews (have responses) and store their call_ids and interview dates
  React.useEffect(() => {
    const checkAssigneesWithResponses = async () => {
      const assigneesWithResponsesSet = new Set<string>();
      const callIdsMap = new Map<string, string>();
      const interviewDatesMap = new Map<string, string>();
      
      for (const assignee of assignees) {
        if (assignee.interview_id && assignee.email) {
          try {
            const responses = await ResponseService.getAllResponses(assignee.interview_id);
            const matchingResponse = responses.find(
              (response) => response.email?.toLowerCase() === assignee.email.toLowerCase()
            );
            if (matchingResponse) {
              assigneesWithResponsesSet.add(assignee.email.toLowerCase());
              // Store the call_id for this assignee
              callIdsMap.set(assignee.email.toLowerCase(), matchingResponse.call_id);
              // Store the interview taken date (created_at from response)
              if (matchingResponse.created_at) {
                const interviewDate = new Date(matchingResponse.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                interviewDatesMap.set(assignee.email.toLowerCase(), interviewDate);
              }
            }
          } catch (error) {
            console.error(`Error checking responses for assignee ${assignee.email}:`, error);
          }
        }
      }
      
      setAssigneesWithResponses(assigneesWithResponsesSet);
      setAssigneeCallIds(callIdsMap);
      setAssigneeInterviewDates(interviewDatesMap);
    };

    if (assignees.length > 0) {
      checkAssigneesWithResponses();
    }
  }, [assignees]);


  // Get unique tags from assignees
  const uniqueTags = React.useMemo(() => {
    const tags = assignees
      .map(a => a.tag)
      .filter((tag): tag is string => !!tag && tag.trim() !== '');
    return Array.from(new Set(tags)).sort();
  }, [assignees]);

  // Filter assignees based on search, status, interview, and tag
  React.useEffect(() => {
    let filtered = assignees;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignee => assignee.status === statusFilter);
    }

    if (interviewFilter !== 'all') {
      if (interviewFilter === 'unassigned') {
        filtered = filtered.filter(assignee => !assignee.interview_id);
      } else if (interviewFilter === 'assigned') {
        filtered = filtered.filter(assignee => assignee.interview_id);
      } else {
        filtered = filtered.filter(assignee => assignee.interview_id === interviewFilter);
      }
    }

    if (tagFilter !== 'all') {
      if (tagFilter === 'no-tag') {
        filtered = filtered.filter(assignee => !assignee.tag || assignee.tag.trim() === '');
      } else {
        filtered = filtered.filter(assignee => assignee.tag === tagFilter);
      }
    }

    if (reviewFilter !== 'all') {
      if (reviewFilter === 'no-review') {
        filtered = filtered.filter(assignee => !assignee.review_status || assignee.review_status === 'NO_STATUS');
      } else {
        filtered = filtered.filter(assignee => assignee.review_status === reviewFilter);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(assignee =>
        assignee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignee.tag && assignee.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (assignee.applicant_id && assignee.applicant_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredAssignees(filtered);
  }, [assignees, searchTerm, statusFilter, interviewFilter, tagFilter, reviewFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleInterviewFilter = (value: string) => {
    setInterviewFilter(value);
  };

  const handleTagFilter = (value: string) => {
    setTagFilter(value);
  };

  const handleReviewFilter = (value: string) => {
    setReviewFilter(value);
  };

  const getReviewStatusBadge = (reviewStatus: string | null | undefined) => {
    if (!reviewStatus || reviewStatus === 'NO_STATUS') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700">No Status</Badge>;
    }
    switch (reviewStatus) {
      case 'NOT_SELECTED':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Not Selected</Badge>;
      case 'POTENTIAL':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Potential</Badge>;
      case 'SELECTED':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Selected</Badge>;
      default:
        return <Badge variant="outline">No Status</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleDeleteAssignee = (assignee: InterviewAssignee) => {
    setAssigneeToDelete(assignee);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (assigneeToDelete) {
      const success = await deleteAssignee(assigneeToDelete.id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Assignee deleted successfully',
        });
        refreshAssignees();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete assignee',
          variant: 'destructive',
        });
      }
      setDeleteConfirmOpen(false);
      setAssigneeToDelete(null);
    }
  };

  // Checkbox selection handlers
  const handleSelectAssignee = (assigneeId: number) => {
    setSelectedAssignees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assigneeId)) {
        newSet.delete(assigneeId);
      } else {
        newSet.add(assigneeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAssignees.size === filteredAssignees.length) {
      setSelectedAssignees(new Set());
    } else {
      setSelectedAssignees(new Set(filteredAssignees.map(a => a.id)));
    }
  };

  const isAllSelected = filteredAssignees.length > 0 && selectedAssignees.size === filteredAssignees.length;
  const isIndeterminate = selectedAssignees.size > 0 && selectedAssignees.size < filteredAssignees.length;

  // Send emails to selected assignees
  const handleSendEmails = async () => {
    if (selectedAssignees.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one assignee to send emails',
        variant: 'destructive',
      });
      return;
    }

    const selected = filteredAssignees.filter(a => selectedAssignees.has(a.id));
    const assigneesWithInterviews = selected.filter(a => a.interview_id && a.email);

    if (assigneesWithInterviews.length === 0) {
      toast({
        title: 'No Valid Assignees',
        description: 'Selected assignees must have an interview assigned and an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmails(true);
    try {
      const response = await fetch('/api/send-assignee-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignees: assigneesWithInterviews.map(a => ({
            id: a.id,
            email: a.email,
            first_name: a.first_name,
            last_name: a.last_name,
            interview_id: a.interview_id,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Emails sent successfully to ${assigneesWithInterviews.length} assignee(s)`,
        });
        setSelectedAssignees(new Set());
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send emails',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Export function
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Applicant ID', 'Status', 'Review Status', 'Tag', 'Interview', 'Assigned At', 'Notes'];
    const rows = filteredAssignees.map(assignee => [
      `${assignee.first_name} ${assignee.last_name}`,
      assignee.email,
      assignee.phone || '',
      assignee.applicant_id || '',
      assignee.status,
      assignee.review_status || 'NO_STATUS',
      assignee.tag || '',
      assignee.interview_id ? (interviews.find(i => i.id === assignee.interview_id)?.name || assignee.interview_id) : 'Unassigned',
      assignee.assigned_at ? new Date(assignee.assigned_at).toLocaleString() : '',
      assignee.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assignees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditAssignee = (assignee: InterviewAssignee) => {
    setSelectedAssignee(assignee);
    setCreateModalOpen(true);
  };

  const handleViewDetails = (assignee: InterviewAssignee) => {
    setViewAssignee(assignee);
    setIsViewModalOpen(true);
  };
  
  const handleCreateNew = () => {
    setSelectedAssignee(null);
    setCreateModalOpen(true);
  };

  const getStats = () => {
    const total = assignees.length;
    const active = assignees.filter(a => a.status === 'active').length;
    const assigned = assignees.filter(a => a.interview_id).length;
    const unassigned = assignees.filter(a => !a.interview_id).length;

    return { total, active, assigned, unassigned };
  };

  const stats = getStats();

  if (assigneesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading assignees...</p>
        </div>
      </div>
    );
  }
  // View information to view button
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interview Assignees</h1>
          <p className="text-gray-600">Manage users who can be assigned interviews</p>
        </div>
        <div className="flex gap-2">
          {selectedAssignees.size > 0 && (
            <Button 
              onClick={handleSendEmails}
              disabled={isSendingEmails}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" />
              {isSendingEmails ? 'Sending...' : `Send Email (${selectedAssignees.size})`}
            </Button>
          )}
          <Button 
            onClick={() => setIsBulkImportModalOpen(true)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Assignee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search assignees by name, email, or tag..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-10"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
            
            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Status
                </label>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Interview Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Interview
                </label>
                <Select value={interviewFilter} onValueChange={handleInterviewFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by interview" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interviews</SelectItem>
                    <SelectItem value="assigned">Has Interview Assigned</SelectItem>
                    <SelectItem value="unassigned">No Interview Assigned</SelectItem>
                    {!interviewsLoading && interviews.length > 0 && (
                      <>
                        <SelectItem value="separator" disabled className="border-t my-1">
                          ──────────
                        </SelectItem>
                        {interviews.map((interview) => (
                          <SelectItem key={interview.id} value={interview.id}>
                            {interview.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                 Department / Tag
                </label>
                <Select value={tagFilter} onValueChange={handleTagFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    <SelectItem value="no-tag">No Tag</SelectItem>
                    {uniqueTags.length > 0 && (
                      <>
                        <SelectItem value="separator" disabled className="border-t my-1">
                          ──────────
                        </SelectItem>
                        {uniqueTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Review Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Review Status
                </label>
                <Select value={reviewFilter} onValueChange={handleReviewFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by review" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="no-review">No Review</SelectItem>
                    <SelectItem value="NO_STATUS">No Status</SelectItem>
                    <SelectItem value="NOT_SELECTED">Not Selected</SelectItem>
                    <SelectItem value="POTENTIAL">Potential</SelectItem>
                    <SelectItem value="SELECTED">Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== 'all' || interviewFilter !== 'all' || tagFilter !== 'all' || reviewFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="text-sm text-gray-600">Active filters:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {interviewFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Interview: {interviewFilter === 'assigned' ? 'Assigned' : interviewFilter === 'unassigned' ? 'Unassigned' : interviews.find(i => i.id === interviewFilter)?.name || interviewFilter}
                    <button
                      onClick={() => setInterviewFilter('all')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {tagFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tag: {tagFilter === 'no-tag' ? 'No Tag' : tagFilter}
                    <button
                      onClick={() => setTagFilter('all')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {reviewFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Review: {reviewFilter === 'no-review' ? 'No Review' : reviewFilter === 'NO_STATUS' ? 'No Status' : reviewFilter === 'NOT_SELECTED' ? 'Not Selected' : reviewFilter === 'POTENTIAL' ? 'Potential' : reviewFilter === 'SELECTED' ? 'Selected' : reviewFilter}
                    <button
                      onClick={() => setReviewFilter('all')}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setInterviewFilter('all');
                    setTagFilter('all');
                    setReviewFilter('all');
                  }}
                  className="text-xs h-6"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
        <TabsContent value="grid" className="space-y-4">
          {filteredAssignees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignees found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by adding your first assignee.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Assignee
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredAssignees.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : isIndeterminate ? (
                      <div className="h-5 w-5 border-2 border-blue-600 bg-blue-100 rounded flex items-center justify-center">
                        <div className="h-2 w-2 bg-blue-600 rounded" />
                      </div>
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                    <span>Select All ({selectedAssignees.size} selected)</span>
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssignees.map((assignee) => {
                  const callId = assigneeCallIds.get(assignee.email.toLowerCase());
                  const interviewDate = assigneeInterviewDates.get(assignee.email.toLowerCase());
                  return (
                    <AssigneeCard
                      key={assignee.id}
                      assignee={assignee}
                      onEdit={handleEditAssignee}
                      onViewDetails={handleViewDetails}
                      interviews={interviews}
                      hasGivenInterview={assigneesWithResponses.has(assignee.email.toLowerCase())}
                      callId={callId}
                      interviewDate={interviewDate}
                      isSelected={selectedAssignees.has(assignee.id)}
                      onSelect={() => handleSelectAssignee(assignee.id)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignees Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 w-12">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center"
                          title="Select All"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : isIndeterminate ? (
                            <div className="h-5 w-5 border-2 border-blue-600 bg-blue-100 rounded flex items-center justify-center">
                              <div className="h-2 w-2 bg-blue-600 rounded" />
                            </div>
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2">Profile</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Applicant ID</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Review</th>
                      <th className="text-left p-2">Tag</th>
                      <th className="text-left p-2">Assignment</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignees.map((assignee) => (
                      <tr key={assignee.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <button
                            onClick={() => handleSelectAssignee(assignee.id)}
                            className="flex items-center"
                          >
                            {selectedAssignees.has(assignee.id) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={assignee.avatar_url}
                              alt={`${assignee.first_name} ${assignee.last_name}`}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getInitials(assignee.first_name, assignee.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {assignee.first_name} {assignee.last_name}
                            </div>
                            {assignee.phone && (
                              <div className="text-sm text-gray-500">{assignee.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{assignee.email}</td>
                        <td className="p-2">
                          {assignee.applicant_id ? (
                            <span className="text-sm font-mono text-gray-700">{assignee.applicant_id}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge variant={assignee.status === 'active' ? 'default' : 'secondary'}>
                            {assignee.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {getReviewStatusBadge(assignee.review_status)}
                        </td>
                        <td className="p-2">
                          {assignee.tag ? (
                            <Badge variant="outline" className="text-purple-600">
                              {assignee.tag}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {assignee.interview_id ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-green-600">
                                Assigned
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {interviews.find(i => i.id === assignee.interview_id)?.name || assignee.interview_id}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Unassigned
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            {assignee.interview_id && assigneesWithResponses.has(assignee.email.toLowerCase()) && (() => {
                              const callId = assigneeCallIds.get(assignee.email.toLowerCase());
                              return callId ? (
                                <Link
                                  href={`/interviews/${assignee.interview_id}?call=${callId}`}
                                  target="_blank"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Interview
                                  </Button>
                                </Link>
                              ) : null;
                            })()}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAssignee(assignee)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(assignee)}
                            >
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAssignee(assignee)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <CreateAssigneeModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        assignee={selectedAssignee}
        mode={selectedAssignee ? 'edit' : 'create'}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onImportComplete={() => {
          // Refresh the assignees list after import
          refreshAssignees();
        }}
      />

      {/* View Details Modal */}
      {isViewModalOpen && viewAssignee && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assignee Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{viewAssignee.first_name} {viewAssignee.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{viewAssignee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{viewAssignee.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={`${viewAssignee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {viewAssignee.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Interview Assignment</p>
                {viewAssignee.interview_id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-blue-600">
                      {interviews.find(i => i.id === viewAssignee.interview_id)?.name || viewAssignee.interview_id}
                    </p>
                  </div>
                ) : (
                  <p className="font-medium text-gray-500">No interview assigned</p>
                )}
              </div>
              {viewAssignee.assigned_at && (
                <div>
                  <p className="text-sm text-gray-500">Assigned at</p>
                  <p className="font-medium">{new Date(viewAssignee.assigned_at).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Tag</p>
                {viewAssignee.tag ? (
                  <Badge variant="outline" className="text-purple-600">
                    {viewAssignee.tag}
                  </Badge>
                ) : (
                  <p className="font-medium text-gray-400">No tag assigned</p>
                )}
              </div>
              {viewAssignee.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{viewAssignee.notes}</p>
                </div>
              )}
              {viewAssignee.interview_id && (() => {
                const callId = assigneeCallIds.get(viewAssignee.email.toLowerCase());
                return callId ? (
                  <div>
                    <p className="text-sm text-gray-500">Interview Details</p>
                    <Link
                      href={`/interviews/${viewAssignee.interview_id}?call=${callId}`}
                      target="_blank"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 mt-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Interview Details
                      </Button>
                    </Link>
                  </div>
                ) : assigneesWithResponses.has(viewAssignee.email.toLowerCase()) ? (
                  <div>
                    <p className="text-sm text-gray-500">Interview Details</p>
                    <Link
                      href={`/interviews/${viewAssignee.interview_id}?email=${encodeURIComponent(viewAssignee.email)}`}
                      target="_blank"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 mt-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Interview Details
                      </Button>
                    </Link>
                  </div>
                ) : null;
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Applicant</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete <strong>{assigneeToDelete?.first_name} {assigneeToDelete?.last_name}</strong>?
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                This action cannot be undone. All associated data will be permanently deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmOpen(false);
              setAssigneeToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* End of View Details Modal */}
    </div>
  );
}
