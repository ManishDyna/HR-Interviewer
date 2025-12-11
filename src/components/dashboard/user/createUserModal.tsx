'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InterviewAssignee, CreateAssigneeRequest, UpdateAssigneeRequest, ReviewStatus } from '@/types/user';
import { useAssignees } from '@/contexts/users.context';
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showExistingImage, setShowExistingImage] = useState(true);
  const { addAssignee, updateAssignee, refreshAssignees } = useAssignees();
  const { interviews } = useInterviews();
  
  const [formData, setFormData] = useState<CreateAssigneeRequest>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    interview_id: '',
    organization_id: null,
    status: 'active',
    notes: '',
    tag: null,
    applicant_id: null,
    review_status: null
  });
  
  useEffect(() => {
    
    if (assignee && mode === 'edit') {
      const avatarUrl = assignee.avatar_url || '';
      setFormData({
        first_name: assignee.first_name || '',
        last_name: assignee.last_name || '',
        email: assignee.email || '',
        phone: assignee.phone || '',
        avatar_url: avatarUrl,
        interview_id: assignee.interview_id || '',
        organization_id: assignee.organization_id || null,
        status: assignee.status || 'active',
        notes: assignee.notes || '',
        tag: assignee.tag || null,
        applicant_id: assignee.applicant_id || null,
        review_status: assignee.review_status || null
      });
      // Don't show existing images to prevent 404 errors
      setShowExistingImage(false);
      setUserImage(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
    } else if (mode === 'create') {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        avatar_url: '',
        interview_id: '',
        organization_id: null,
        status: 'active',
        notes: '',
        tag: null,
        applicant_id: null,
        review_status: null
      });
      setShowExistingImage(false);
      setUserImage(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
    }
  }, [assignee, mode]);


  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Form submitted, userImage:', userImage ? `${userImage.name} (${userImage.size} bytes)` : 'null');

    try {
    // Create a copy of the form data to modify
    const updatedFormData = { ...formData };

    // If userImage is present, upload it first
    if (userImage) {
      console.log('Uploading image:', userImage.name, userImage.size, 'bytes');
      const imageFormData = new FormData();
      imageFormData.append("userImage", userImage);

      const uploadRes = await fetch("/api/upload-user-image", {
        method: "POST",
        body: imageFormData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Image upload failed:', errorData);
        throw new Error(`Image upload failed: ${errorData.error || 'Unknown error'}`);
      }

      const { imageUrl } = await uploadRes.json();
      console.log('Image uploaded successfully:', imageUrl);
      // Update the avatar_url in the form data
      updatedFormData.avatar_url = imageUrl;
    }

    if (mode === 'create') {
      // Convert empty interview_id to null for database constraint
      const createData = {
        ...updatedFormData,
        interview_id: updatedFormData.interview_id || null,
        organization_id: updatedFormData.organization_id || null,
      };
      await addAssignee(createData);
      // Refresh the list after creating
      await refreshAssignees();
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
        notes: updatedFormData.notes,
        tag: updatedFormData.tag || null,
        review_status: updatedFormData.review_status || null
      };
      await updateAssignee(assignee.id, updateData);
      // Refresh the list after updating
      await refreshAssignees();
    }

    // Blur any focused elements before closing
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    onClose();
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      interview_id: '',
      avatar_url: '',
      organization_id: null,
      status: 'active',
      notes: '',
      tag: null,
      applicant_id: null,
      review_status: null
    });
    setUserImage(null); // Reset the image state
    // Cleanup preview URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  } catch (error) {
    console.error('Error saving assignee:', error);
    // Show error toast to user
    alert(`Error: ${error instanceof Error ? error.message : 'Failed to save assignee'}`);
  } finally {
    setIsLoading(false);
  }
};

  const handleInputChange = (field: keyof CreateAssigneeRequest, value: string | null) => {
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
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.size, 'bytes');
      setUserImage(file);
      // Create preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Assignee' : 'Edit Assignee'}
          </DialogTitle>
          <DialogDescription>
            Fill out the following details to {mode === 'create' ? 'create a new' : 'edit the'} assignee.
        </DialogDescription>
        </DialogHeader>
        
        <form
          onSubmit={(e) => {
            // prevent native submit bubbling/closing
            e.preventDefault();
            handleSubmit(e);
          }}
          className="space-y-4"
        >
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
                {interviews.map((interview: Interview) => (
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
              {/* Show preview for newly selected file */}
              {userImage && imagePreviewUrl && (
                <div className="flex items-center gap-3">
                  <img 
                    src={imagePreviewUrl} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {userImage.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(userImage.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}
              {/* Show existing image preview if in edit mode */}
              {!userImage && formData.avatar_url && showExistingImage && (
                <img 
                  src={formData.avatar_url} 
                  alt="Current" 
                  className="w-20 h-20 object-cover rounded-full"
                />
              )}
              {/* Standard file input */}
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
            <Label htmlFor="tag">Department / Tag</Label>
            <Input
              id="tag"
              value={formData.tag || ''}
              onChange={handleInputChangeEvent('tag')}
              placeholder="Enter a tag (e.g., Frontend, Backend, Senior)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_status">Review Status</Label>
            <Select
              value={formData.review_status || 'NO_STATUS'}
              onValueChange={(value) => handleInputChange('review_status', value === 'NO_STATUS' ? null : value as ReviewStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select review status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_STATUS">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                    No Status
                  </div>
                </SelectItem>
                <SelectItem value="NOT_SELECTED">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                    Not Selected
                  </div>
                </SelectItem>
                <SelectItem value="POTENTIAL">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                    Potential
                  </div>
                </SelectItem>
                <SelectItem value="SELECTED">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                    Selected
                  </div>
                </SelectItem>
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
            <Button type="button" variant="outline" onClick={onClose}>
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
