'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Grid3X3, List, Users, UserCheck, UserX } from 'lucide-react';
import { useAssignees } from '@/contexts/users.context';
import { AssigneeCard } from '@/components/dashboard/user/userCard';
import { CreateAssigneeModal } from '@/components/dashboard/user/createUserModal';
import { InterviewAssignee } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AssigneesPage() {
  const { assignees, assigneesLoading, searchAssignees, getAssigneesByStatus } = useAssignees();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<InterviewAssignee | null>(null);
  const [filteredAssignees, setFilteredAssignees] = useState<InterviewAssignee[]>([]);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAssignee, setViewAssignee] = useState<InterviewAssignee | null>(null);


  // Filter assignees based on search and status
  React.useEffect(() => {
    let filtered = assignees;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignee => assignee.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(assignee =>
        assignee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssignees(filtered);
  }, [assignees, searchTerm, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleEditAssignee = (assignee: InterviewAssignee) => {
    setSelectedAssignee(assignee);
    setIsCreateModalOpen(true);
  };

  const handleViewDetails = (assignee: InterviewAssignee) => {
    setViewAssignee(assignee);
    setIsViewModalOpen(true);
  };
  
  const handleCreateNew = () => {
    setSelectedAssignee(null);
    setIsCreateModalOpen(true);
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
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Assignee
        </Button>
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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assignees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignees.map((assignee) => (
                <AssigneeCard
                  key={assignee.id}
                  assignee={assignee}
                  onEdit={handleEditAssignee}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
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
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Assignment</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignees.map((assignee) => (
                      <tr key={assignee.id} className="border-b hover:bg-gray-50">
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
                          <Badge variant={assignee.status === 'active' ? 'default' : 'secondary'}>
                            {assignee.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {assignee.interview_id ? (
                            <Badge variant="outline" className="text-green-600">
                              Assigned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Unassigned
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
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
        onClose={() => setIsCreateModalOpen(false)}
        assignee={selectedAssignee}
        mode={selectedAssignee ? 'edit' : 'create'}
      />
      {/* View Details Modal */}
      {isViewModalOpen && viewAssignee && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assignee Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p><strong>Name:</strong> {viewAssignee.first_name} {viewAssignee.last_name}</p>
              <p><strong>Email:</strong> {viewAssignee.email}</p>
              <p><strong>Phone:</strong> {viewAssignee.phone || 'N/A'}</p>
              <p><strong>Status:</strong> {viewAssignee.status}</p>
               <p><strong>Interview:</strong> {viewAssignee.interview_id}</p>
              {viewAssignee.notes && <p><strong>Notes:</strong> {viewAssignee.notes}</p>}
              {viewAssignee.assigned_at && (
                <p><strong>Assigned at:</strong> {new Date(viewAssignee.assigned_at).toLocaleString()}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* End of View Details Modal */}
    </div>
  );
}
