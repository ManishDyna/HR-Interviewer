'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const filePickerOpenRef = useRef(false);
  const fileJustSelectedRef = useRef(false); // Track if file was just selected (keep protection active)
  const preserveFormDataRef = useRef(false); // Track if we should preserve form data after file picker
  const previousIsOpenRef = useRef(false); // Track previous open state to detect actual opens
  const savedFormDataRef = useRef<CreateAssigneeRequest | null>(null); // Store form data to restore after file picker
  const { addAssignee, updateAssignee, refreshAssignees } = useAssignees();
  const { interviews } = useInterviews();
  const formRef = useRef<HTMLFormElement>(null);
  
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
    // Only reset form data when the modal is first opened or when switching between create/edit modes
    // Don't reset if the modal is just reopening after file picker
    const isActuallyOpening = isOpen && !previousIsOpenRef.current;
    
    if (!isOpen) {
      // Don't reset preserve flag here - keep it if we have saved data
      // The form data will be saved in handleImageChange or when dialog actually closes
      if (!savedFormDataRef.current) {
        preserveFormDataRef.current = false;
      }
      previousIsOpenRef.current = false;
      return;
    }
    
    // Update the previous open state
    previousIsOpenRef.current = isOpen;
    
    if (assignee && mode === 'edit') {
      setFormData({
        first_name: assignee.first_name || '',
        last_name: assignee.last_name || '',
        email: assignee.email || '',
        phone: assignee.phone || '',
        avatar_url: assignee.avatar_url || '',
        interview_id: assignee.interview_id || '',
        organization_id: assignee.organization_id || null,
        status: assignee.status || 'active',
        notes: assignee.notes || '',
        tag: assignee.tag || null,
        applicant_id: assignee.applicant_id || null,
        review_status: assignee.review_status || null
      });
      preserveFormDataRef.current = false;
      savedFormDataRef.current = null;
    } else if (mode === 'create') {
      // If we have saved form data (from a previous close), restore it
      if (savedFormDataRef.current) {
        setFormData(savedFormDataRef.current);
        savedFormDataRef.current = null;
        preserveFormDataRef.current = false;
      } else if (isActuallyOpening && !preserveFormDataRef.current) {
        // Only reset form data if:
        // 1. The modal is actually opening (not just reopening after file picker)
        // 2. We're not preserving form data
        // 3. We don't have saved form data
        setFormData(prev => {
          // Only reset if form is actually empty
          if (!prev.first_name && !prev.email) {
            return {
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
              review_status: null
            };
          }
          return prev; // Keep existing data
        });
      }
      // Reset the preserve flag after checking (but only if we actually opened and don't have saved data)
      if (isActuallyOpening && !savedFormDataRef.current) {
        preserveFormDataRef.current = false;
      }
    }
  }, [assignee, mode, isOpen]);

  // Prevent aria-hidden warning by managing focus better
  useEffect(() => {
    if (!isOpen) {
      // Blur all inputs when dialog closes to prevent aria-hidden warnings
      const inputs = formRef.current?.querySelectorAll('input, textarea, select');
      inputs?.forEach((input) => {
        if (input instanceof HTMLElement) {
          input.blur();
        }
      });
    } else {
      // When dialog opens, ensure proper focus management and remove aria-hidden
      const setupDialogProtection = () => {
        const dialogElement = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
        if (!dialogElement) return null;

        // Immediately remove aria-hidden if it exists
        if (dialogElement.getAttribute('aria-hidden') === 'true') {
          dialogElement.removeAttribute('aria-hidden');
        }
        if (dialogElement.hasAttribute('data-aria-hidden')) {
          dialogElement.removeAttribute('data-aria-hidden');
        }

        // Intercept setAttribute to prevent aria-hidden from being set when dialog has focused elements
        const originalSetAttribute = dialogElement.setAttribute.bind(dialogElement);
        let isIntercepted = false;
        const interceptedSetAttribute = function(name: string, value: string) {
          // If trying to set aria-hidden to true, check if dialog has focused elements first
          if (name === 'aria-hidden' && value === 'true') {
            const hasFocusedElement = dialogElement.querySelector(':focus') !== null ||
                                     dialogElement.contains(document.activeElement);
            if (hasFocusedElement) {
              // Don't set aria-hidden if dialog has focused elements
              // Use a microtask to check again immediately after, in case focus changes
              Promise.resolve().then(() => {
                if (dialogElement.contains(document.activeElement) && 
                    dialogElement.getAttribute('aria-hidden') === 'true') {
                  dialogElement.removeAttribute('aria-hidden');
                }
              });
              return;
            }
          }
          // For all other attributes, use the original setAttribute
          return originalSetAttribute(name, value);
        };
        dialogElement.setAttribute = interceptedSetAttribute;
        isIntercepted = true;

        // Set up a focus listener to ensure aria-hidden is removed when inputs are focused
        const handleFocus = (e: FocusEvent) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') {
            const dialog = target.closest('[role="dialog"]') as HTMLElement;
            if (dialog) {
              // Remove aria-hidden immediately and synchronously when inputs are focused
              if (dialog.getAttribute('aria-hidden') === 'true') {
                dialog.removeAttribute('aria-hidden');
              }
              if (dialog.hasAttribute('data-aria-hidden')) {
                dialog.removeAttribute('data-aria-hidden');
              }
            }
          }
        };
        
        document.addEventListener('focusin', handleFocus, true); // Use capture phase for immediate handling
        
        return {
          cleanup: () => {
            document.removeEventListener('focusin', handleFocus, true);
            // Restore original setAttribute if it was overridden
            if (isIntercepted) {
              dialogElement.setAttribute = originalSetAttribute;
            }
          }
        };
      };

      // Try to set up immediately
      let protection = setupDialogProtection();
      
      // If dialog not found yet, try again after a short delay
      if (!protection) {
        const timeoutId = setTimeout(() => {
          protection = setupDialogProtection();
        }, 0);
        
        return () => {
          clearTimeout(timeoutId);
          if (protection) {
            protection.cleanup();
          }
        };
      }
      
      return () => {
        if (protection) {
          protection.cleanup();
        }
      };
    }
  }, [isOpen]);

  // Handle Select dropdown open state and dialog aria-hidden to prevent warnings
  useEffect(() => {
    if (!isOpen) return;

    // More aggressive MutationObserver that runs synchronously
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-hidden' || mutation.attributeName === 'data-aria-hidden')) {
          const target = mutation.target as HTMLElement;
          
          // Check if this is the dialog content itself
          const isDialogContent = 
            target.getAttribute('role') === 'dialog' ||
            (target.hasAttribute('data-state') && target.getAttribute('data-state') === 'open');
          
          // Check if this is a Select portal or its children
          const isSelectPortal = 
            target.hasAttribute('data-radix-select-content') ||
            target.closest('[data-radix-select-content]') !== null ||
            target.closest('[role="listbox"]') !== null;
          
          // CRITICAL: Check if dialog contains focused elements before allowing aria-hidden
          if (isDialogContent) {
            const dialogElement = target;
            // Check multiple ways to detect focused elements
            const hasFocusedElement = 
              dialogElement.querySelector(':focus') !== null ||
              dialogElement.contains(document.activeElement) ||
              (document.activeElement && dialogElement.contains(document.activeElement));
            
            // If aria-hidden is being set to true AND dialog has focused elements, prevent it
            if ((target.getAttribute('aria-hidden') === 'true' || 
                 target.getAttribute('data-aria-hidden') === 'true') && 
                hasFocusedElement) {
              // Remove immediately, synchronously - use multiple attempts
              target.removeAttribute('aria-hidden');
              target.removeAttribute('data-aria-hidden');
              // Force remove by setting to false first, then removing
              target.setAttribute('aria-hidden', 'false');
              target.removeAttribute('aria-hidden');
              return; // Don't process further
            }
          }
          
          // If aria-hidden is set to true on dialog content or Select portal, check and remove it
          if (target.getAttribute('aria-hidden') === 'true' || 
              target.getAttribute('data-aria-hidden') === 'true') {
            if (isDialogContent || isSelectPortal) {
              // For dialog content, always check for focused elements first
              if (isDialogContent) {
                const hasFocusedElement = 
                  target.querySelector(':focus') !== null ||
                  target.contains(document.activeElement);
                if (hasFocusedElement) {
                  target.removeAttribute('aria-hidden');
                  target.removeAttribute('data-aria-hidden');
                  return;
                }
              }
              // Remove synchronously, not in requestAnimationFrame
              target.removeAttribute('aria-hidden');
              if (target.hasAttribute('data-aria-hidden')) {
                target.removeAttribute('data-aria-hidden');
              }
            }
          }
        }
      });
    });

    // Observe the entire document for aria-hidden changes with immediate callback
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden', 'data-aria-hidden'],
      subtree: true,
      attributeOldValue: false, // Don't need old value, just detect changes
    });

    // Also add a focus change listener to immediately check and fix aria-hidden
    const handleFocusChange = () => {
      const dialogContent = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
      if (dialogContent && document.activeElement) {
        const hasFocusedElement = dialogContent.contains(document.activeElement);
        if (hasFocusedElement) {
          // Immediately remove aria-hidden if it exists
          if (dialogContent.getAttribute('aria-hidden') === 'true') {
            dialogContent.removeAttribute('aria-hidden');
          }
          if (dialogContent.hasAttribute('data-aria-hidden')) {
            dialogContent.removeAttribute('data-aria-hidden');
          }
        }
      }
    };

    // Listen to focus changes on capture phase for immediate handling
    document.addEventListener('focusin', handleFocusChange, true);
    document.addEventListener('focus', handleFocusChange, true);

    // Also set up a more frequent check specifically for focused elements
    // Use a very short interval to catch aria-hidden immediately
    const focusedElementCheck = setInterval(() => {
      const dialogContent = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
      if (dialogContent) {
        // Check if dialog has focused elements
        const hasFocusedElement = dialogContent.querySelector(':focus') !== null ||
                                   dialogContent.contains(document.activeElement);
        
        // If dialog has focused elements, ensure aria-hidden is not set
        if (hasFocusedElement) {
          // Remove aria-hidden immediately
          if (dialogContent.getAttribute('aria-hidden') === 'true') {
            dialogContent.removeAttribute('aria-hidden');
          }
          if (dialogContent.hasAttribute('data-aria-hidden')) {
            dialogContent.removeAttribute('data-aria-hidden');
          }
          
          // Also check all ancestors to ensure none have aria-hidden
          let parent = dialogContent.parentElement;
          while (parent && parent !== document.body) {
            if (parent.getAttribute('aria-hidden') === 'true' && 
                parent.contains(document.activeElement)) {
              parent.removeAttribute('aria-hidden');
            }
            parent = parent.parentElement;
          }
        }
        
        // Also check for Select portals when Select is open
        if (isSelectOpen) {
          const selectPortals = document.querySelectorAll('[data-radix-select-content], [role="listbox"]');
          selectPortals.forEach((portal) => {
            if (portal.getAttribute('aria-hidden') === 'true') {
              portal.removeAttribute('aria-hidden');
            }
            if (portal.hasAttribute('data-aria-hidden')) {
              portal.removeAttribute('data-aria-hidden');
            }
          });
        }
      }
    }, 10); // Check every 10ms for very immediate response

    return () => {
      observer.disconnect();
      if (focusedElementCheck) clearInterval(focusedElementCheck);
      document.removeEventListener('focusin', handleFocusChange, true);
      document.removeEventListener('focus', handleFocusChange, true);
    };
  }, [isOpen, isSelectOpen]);

  const handleClose = () => {
    // Blur any focused elements before closing
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // CRITICAL: Don't close if file picker is open, was recently used, or file was just selected
      // Check all refs and state to prevent accidental closing during file operations
      if (isFilePickerOpen || filePickerOpenRef.current || fileJustSelectedRef.current) {
        // Prevent closing by not calling onClose
        // The dialog will stay open because we're not updating the parent's state
        // This is the key - by not calling onClose(), the parent's isOpen stays true
        return;
      }
      // Blur any focused elements when dialog is closing
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Reset preserve flag when actually closing
      preserveFormDataRef.current = false;
      handleClose();
    }
  }, [isFilePickerOpen]);

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
    
    // Clear saved form data and preserve flag on successful submit
    savedFormDataRef.current = null;
    preserveFormDataRef.current = false;
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
  } catch (error) {
    console.error('Error saving assignee:', error);
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
      setUserImage(e.target.files[0]);
      // Mark that file was just selected - this keeps protection active
      fileJustSelectedRef.current = true;
      // Mark that we should preserve form data when dialog reopens
      preserveFormDataRef.current = true;
      // Also save current form data in case dialog closes and reopens
      setFormData(prev => {
        savedFormDataRef.current = { ...prev };
        return prev;
      });
    }
    
    // Keep the file picker protection active for longer to prevent dialog from closing
    // Only reset after a longer delay to ensure the file picker is fully closed
    // and the dialog has stabilized
    setTimeout(() => {
      // Only reset if we're sure the file picker is closed
      // Check if the file input is still focused or if we have a file selected
      const fileInput = document.getElementById('userImage') as HTMLInputElement;
      if (fileInput && document.activeElement !== fileInput) {
        setIsFilePickerOpen(false);
        filePickerOpenRef.current = false;
        // Reset the "just selected" flag after a delay
        setTimeout(() => {
          fileJustSelectedRef.current = false;
        }, 1000);
      } else {
        // If still focused, check again later
        setTimeout(() => {
          setIsFilePickerOpen(false);
          filePickerOpenRef.current = false;
          setTimeout(() => {
            fileJustSelectedRef.current = false;
          }, 1000);
        }, 300);
      }
    }, 1000); // Increased delay significantly to prevent premature closing
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(e) => {
          // Focus the first input field instead of preventing auto-focus
          // This ensures proper focus management and avoids aria-hidden warnings
          const firstInput = formRef.current?.querySelector('input[type="text"], input[type="email"], input[type="tel"]') as HTMLElement;
          if (firstInput) {
            e.preventDefault();
            // Use requestAnimationFrame to ensure the dialog is fully rendered and accessible
            requestAnimationFrame(() => {
              firstInput.focus();
            });
          }
        }}
        onCloseAutoFocus={(e) => {
          // Prevent focus from returning to the trigger when dialog closes
          // This helps avoid focus issues and aria-hidden warnings
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent closing dialog when file picker is open or file was just selected
          if (isFilePickerOpen || filePickerOpenRef.current || fileJustSelectedRef.current) {
            e.preventDefault();
            return;
          }
          // Prevent closing dialog when clicking on Select dropdown (which is portaled)
          // or when Select is open
          if (isSelectOpen) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          // Check if the click is on a Radix Select portal or listbox
          if (
            target.closest('[role="listbox"]') || 
            target.closest('[data-radix-select-content]') ||
            target.closest('[data-radix-portal]') ||
            target.closest('[data-radix-select-viewport]')
          ) {
            e.preventDefault();
            return;
          }
          // Prevent closing when clicking on file input or its label
          if (
            target.tagName === 'INPUT' && target.getAttribute('type') === 'file' ||
            target.closest('input[type="file"]') ||
            target.closest('label[for*="avatar"]') ||
            target.closest('label[for*="userImage"]')
          ) {
            e.preventDefault();
            return;
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when file picker is open or file was just selected
          if (isFilePickerOpen || filePickerOpenRef.current || fileJustSelectedRef.current) {
            e.preventDefault();
            return;
          }
          
          // Also handle pointer down events to prevent closing on file input clicks
          const target = e.target as HTMLElement;
          
          // Prevent closing when clicking on file input or its label
          const isFileInput = 
            (target.tagName === 'INPUT' && target.getAttribute('type') === 'file') ||
            target.closest('input[type="file"]') !== null ||
            target.closest('label[for*="avatar"]') !== null ||
            target.closest('label[for*="userImage"]') !== null;
          
          if (isFileInput) {
            e.preventDefault();
            return;
          }
          
          // Prevent closing when Select dropdown is open
          if (isSelectOpen) {
            e.preventDefault();
            return;
          }
          
          // Check if clicking on Select portal or any Radix Select element
          const isSelectElement = 
            target.closest('[role="listbox"]') !== null || 
            target.closest('[data-radix-select-content]') !== null ||
            target.closest('[data-radix-portal]') !== null ||
            target.closest('[data-radix-select-viewport]') !== null ||
            target.closest('[data-radix-select-item]') !== null;
          
          if (isSelectElement) {
            e.preventDefault();
            return;
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key when file picker is open or file was just selected
          if (isFilePickerOpen || filePickerOpenRef.current || fileJustSelectedRef.current) {
            e.preventDefault();
            return;
          }
          // Also prevent closing if we have unsaved form data (user is filling the form)
          // This prevents accidental closes while user is working
          if (mode === 'create' && (formData.first_name || formData.email || formData.phone)) {
            // Allow escape to close, but warn user or require confirmation
            // For now, we'll allow it but you can add confirmation if needed
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Assignee' : 'Edit Assignee'}
          </DialogTitle>
          <DialogDescription>
            Fill out the following details to {mode === 'create' ? 'create a new' : 'edit the'} assignee.
        </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={handleInputChangeEvent('first_name')}
                placeholder="Enter first name"
                required
                onBlur={(e) => {
                  // Ensure blur happens properly
                  e.target.blur();
                }}
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
                onBlur={(e) => {
                  e.target.blur();
                }}
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
              onBlur={(e) => {
                e.target.blur();
              }}
            />
          </div>
            
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={handleInputChangeEvent('phone')}
              placeholder="Enter phone number"
              onBlur={(e) => {
                e.target.blur();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview_id">Interview</Label>
            <Select
              value={formData.interview_id || 'none'}
              onValueChange={(value) => handleInputChange('interview_id', value === 'none' ? '' : value)}
              onOpenChange={(open) => {
                setIsSelectOpen(open);
                // When Select opens/closes, ensure proper focus management
                if (open) {
                  // Select is opening - immediately ensure dialog doesn't have aria-hidden
                  // Use multiple immediate checks to catch any aria-hidden that gets set
                  const fixAriaHidden = () => {
                    const dialogContent = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
                    if (dialogContent) {
                      // Check if dialog has focused elements
                      const hasFocusedElement = dialogContent.querySelector(':focus') !== null ||
                                               dialogContent.contains(document.activeElement);
                      
                      if (hasFocusedElement || dialogContent.getAttribute('aria-hidden') === 'true') {
                        dialogContent.removeAttribute('aria-hidden');
                        if (dialogContent.hasAttribute('data-aria-hidden')) {
                          dialogContent.removeAttribute('data-aria-hidden');
                        }
                      }
                    }
                    
                    const selectContent = document.querySelector('[data-radix-select-content]') as HTMLElement;
                    if (selectContent) {
                      selectContent.removeAttribute('aria-hidden');
                    }
                    
                    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
                    if (listbox) {
                      listbox.removeAttribute('aria-hidden');
                    }
                  };
                  
                  // Run immediately and multiple times to catch timing issues
                  fixAriaHidden();
                  setTimeout(fixAriaHidden, 0);
                  setTimeout(fixAriaHidden, 10);
                  setTimeout(fixAriaHidden, 50);
                }
              }}
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
            <Label htmlFor="userImage">Profile Image</Label>
            <div className="flex flex-col gap-2">
              {formData.avatar_url && (
                <img 
                  src={formData.avatar_url} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-full"
                />
              )}
              <Input
                id="userImage"
                type="file"
                name="userImage"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
                onClick={(e) => {
                  // Prevent the click from bubbling up and closing the dialog
                  e.stopPropagation();
                  // Mark that file picker is about to open - use both state and ref
                  setIsFilePickerOpen(true);
                  filePickerOpenRef.current = true;
                }}
                onMouseDown={(e) => {
                  // Also prevent mousedown from closing the dialog
                  e.stopPropagation();
                  // Set the ref immediately to prevent any close events
                  filePickerOpenRef.current = true;
                  setIsFilePickerOpen(true);
                }}
                onFocus={() => {
                  // Mark that file picker might open
                  setIsFilePickerOpen(true);
                  filePickerOpenRef.current = true;
                }}
                onBlur={() => {
                  // When file input loses focus, keep the protection active for a while
                  // This prevents the dialog from closing when the file picker closes
                  // The file picker closing causes the input to blur, which might trigger dialog close
                  setTimeout(() => {
                    // Only reset if no file was selected and enough time has passed
                    // Keep protection active longer to prevent dialog from closing
                    if (!userImage && !filePickerOpenRef.current) {
                      // Double check after another delay
                      setTimeout(() => {
                        if (!userImage) {
                          setIsFilePickerOpen(false);
                        }
                      }, 500);
                    } else if (userImage) {
                      // If a file was selected, preserve form data and keep protection active
                      preserveFormDataRef.current = true;
                      // Save current form data
                      setFormData(prev => {
                        savedFormDataRef.current = { ...prev };
                        return prev;
                      });
                      // Keep file picker protection active for a bit longer
                      setTimeout(() => {
                        setIsFilePickerOpen(false);
                        filePickerOpenRef.current = false;
                      }, 1000);
                    }
                  }, 300);
                }}
              />
            </div>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              onOpenChange={(open) => {
                if (open) {
                  // When Select opens, ensure dialog doesn't have aria-hidden
                  const fixAriaHidden = () => {
                    const dialogContent = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
                    if (dialogContent) {
                      const hasFocusedElement = dialogContent.querySelector(':focus') !== null ||
                                               dialogContent.contains(document.activeElement);
                      if (hasFocusedElement || dialogContent.getAttribute('aria-hidden') === 'true') {
                        dialogContent.removeAttribute('aria-hidden');
                        if (dialogContent.hasAttribute('data-aria-hidden')) {
                          dialogContent.removeAttribute('data-aria-hidden');
                        }
                      }
                    }
                    const selectContent = document.querySelector('[data-radix-select-content]') as HTMLElement;
                    if (selectContent) {
                      selectContent.removeAttribute('aria-hidden');
                    }
                  };
                  fixAriaHidden();
                  setTimeout(fixAriaHidden, 0);
                  setTimeout(fixAriaHidden, 10);
                  setTimeout(fixAriaHidden, 50);
                }
              }}
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
              onBlur={(e) => {
                e.target.blur();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_status">Review Status</Label>
            <Select
              value={formData.review_status || 'NO_STATUS'}
              onValueChange={(value) => handleInputChange('review_status', value === 'NO_STATUS' ? null : value as ReviewStatus)}
              onOpenChange={(open) => {
                if (open) {
                  // When Select opens, ensure dialog doesn't have aria-hidden
                  const fixAriaHidden = () => {
                    const dialogContent = document.querySelector('[role="dialog"][data-state="open"]') as HTMLElement;
                    if (dialogContent) {
                      const hasFocusedElement = dialogContent.querySelector(':focus') !== null ||
                                               dialogContent.contains(document.activeElement);
                      if (hasFocusedElement || dialogContent.getAttribute('aria-hidden') === 'true') {
                        dialogContent.removeAttribute('aria-hidden');
                        if (dialogContent.hasAttribute('data-aria-hidden')) {
                          dialogContent.removeAttribute('data-aria-hidden');
                        }
                      }
                    }
                    const selectContent = document.querySelector('[data-radix-select-content]') as HTMLElement;
                    if (selectContent) {
                      selectContent.removeAttribute('aria-hidden');
                    }
                  };
                  fixAriaHidden();
                  setTimeout(fixAriaHidden, 0);
                  setTimeout(fixAriaHidden, 10);
                  setTimeout(fixAriaHidden, 50);
                }
              }}
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
              onBlur={(e) => {
                e.target.blur();
              }}
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
