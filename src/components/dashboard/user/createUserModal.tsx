'use client';

import React, { useState,useRef} from 'react';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InterviewAssignee, CreateAssigneeRequest, UpdateAssigneeRequest } from '@/types/user';
import { useAssignees } from '@/contexts/users.context';


// I want to fetch Interview List in form
import { useInterviews } from '@/contexts/interviews.context';
import { Interview } from '@/types/interview';
interface CreateAssigneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignee?: InterviewAssignee | null;
  mode: 'create' | 'edit';
}

export const CreateAssigneeModal: React.FC<CreateAssigneeModalProps> = ({
  isOpen,
  onClose,
  assignee,
  mode
}) => {
  const [userImage, setUserImage] = useState<File | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const { addAssignee, updateAssignee } = useAssignees();
  const [formData, setFormData] = useState<CreateAssigneeRequest>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    interview_id: '',
    organization_id: '',
    status: 'active',
    notes: ''
  });
  useEffect(() => {
  if (assignee && mode === 'edit') {
    setFormData({
      first_name: assignee.first_name || '',
      last_name: assignee.last_name || '',
      email: assignee.email || '',
      phone: assignee.phone || '',
      avatar_url: assignee.avatar_url || '',
      interview_id: assignee.interview_id || '',
      organization_id: assignee.organization_id || '',
      status: assignee.status || 'active',
      notes: assignee.notes || ''
    });
  } else if (mode === 'create') {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      avatar_url: '',
      interview_id: '',
      organization_id: '',
      status: 'active',
      notes: ''
    });
  }
}, [assignee, mode]);
  const handleClose = () => {
    onClose();
    // Restore focus to trigger button after modal closes
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 0);
  };
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
    // Create a copy of the form data to modify
    const updatedFormData = { ...formData };

    // If userImage is present, upload it first
    if (userImage) {
      const imageFormData = new FormData();
      imageFormData.append("userImage", userImage);

      const uploadRes = await fetch("/api/upload-user-image", {
        method: "POST",
        body: imageFormData,
      });

      if (!uploadRes.ok) {
        throw new Error("Image upload failed");
      }

      const { imageUrl } = await uploadRes.json();
      // Update the avatar_url in the form data
      updatedFormData.avatar_url = imageUrl;
    }

    if (mode === 'create') {
      // Convert empty interview_id to null for database constraint
      const createData = {
        ...updatedFormData,
        interview_id: updatedFormData.interview_id || null
      };
      await addAssignee(createData);
    } else if (assignee) {
      const updateData: UpdateAssigneeRequest = {
        first_name: updatedFormData.first_name,
        last_name: updatedFormData.last_name,
        email: updatedFormData.email,
        phone: updatedFormData.phone,
        // Convert empty string to null for database constraint
        interview_id: updatedFormData.interview_id || null,
        avatar_url: updatedFormData.avatar_url,
        status: updatedFormData.status,
        notes: updatedFormData.notes
      };
      await updateAssignee(assignee.id, updateData);
    }

    onClose();
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      interview_id: '',
      avatar_url: '',
      organization_id: '',
      status: 'active',
      notes: ''
    });
    setUserImage(null); // Reset the image state
  } catch (error) {
    console.error('Error saving assignee:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleInputChange = (field: keyof CreateAssigneeRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChangeEvent = (field: keyof CreateAssigneeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleInputChange(field, e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserImage(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Assignee' : 'Edit Assignee'}
          </DialogTitle>
          <DialogDescription>
            Fill out the following details to {mode === 'create' ? 'create a new' : 'edit the'} assignee.
        </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
                              <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleInputChangeEvent('first_name')}
                  placeholder="Enter first name"
                  required
                />
            </div>
            
                <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleInputChangeEvent('last_name')}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChangeEvent('email')}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleInputChangeEvent('phone')}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview_id">Interview</Label>
              <Select
                value={formData.interview_id || 'none'}
                onValueChange={(value) => handleInputChange('interview_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interview" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Interview</SelectItem>
                  {useInterviews().interviews.map((interview: Interview) => (
                    <SelectItem key={interview.id} value={interview.id}>
                      {interview.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Profile Image</Label>
              <div className="flex flex-col gap-2">
                {formData.avatar_url && (
                  <img 
                    src={formData.avatar_url} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-full"
                  />
                )}
                <Input
                  type="file"
                  name="userImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
                      <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChangeEvent('notes')}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Assignee' : 'Update Assignee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
