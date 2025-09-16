'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { addToast } from '@heroui/toast';
import { type WellnessCategory, WELLNESS_DESCRIPTIONS } from '@/lib/wellnessColors';

interface CustomTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomTaskForm {
  title: string;
  duration: string;
  category: WellnessCategory;
  description: string;
}

const DURATION_OPTIONS = [
  { key: '5min', label: '5 minutes' },
  { key: '10min', label: '10 minutes' },
  { key: '15min', label: '15 minutes' },
  { key: '20min', label: '20 minutes' },
  { key: '30min', label: '30 minutes' },
  { key: '45min', label: '45 minutes' },
  { key: '1hour', label: '1 hour' },
  { key: '1.5hours', label: '1.5 hours' },
  { key: '2hours', label: '2 hours' },
  { key: '3hours', label: '3 hours' },
  { key: 'morning', label: 'Half day (morning)' },
  { key: 'afternoon', label: 'Half day (afternoon)' },
  { key: 'allday', label: 'All day' },
];

const WELLNESS_OPTIONS: { key: WellnessCategory; label: string; description: string }[] = [
  { key: 'custom', label: 'Custom', description: WELLNESS_DESCRIPTIONS.custom },
  { key: 'overall_health', label: 'Overall Health', description: WELLNESS_DESCRIPTIONS.overall_health },
  { key: 'brainy', label: 'Mental Focus', description: WELLNESS_DESCRIPTIONS.brainy },
  { key: 'body', label: 'Physical Fitness', description: WELLNESS_DESCRIPTIONS.body },
  { key: 'money', label: 'Financial', description: WELLNESS_DESCRIPTIONS.money },
  { key: 'personal_growth', label: 'Personal Growth', description: WELLNESS_DESCRIPTIONS.personal_growth },
  { key: 'body_maintenance', label: 'Body Maintenance', description: WELLNESS_DESCRIPTIONS.body_maintenance },
];

export default function CustomTaskModal({ isOpen, onClose, onSuccess }: CustomTaskModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CustomTaskForm>({
    title: '',
    duration: '15min',
    category: 'custom',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomTaskForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomTaskForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (createAnother: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/routines/custom-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create custom task');
      }

      addToast({
        title: 'Success!',
        description: `Custom task "${formData.title}" has been added to your daily routine.`,
        color: 'success',
      });

      // Reset form for next task or close
      setFormData({
        title: '',
        duration: '15min',
        category: 'custom',
        description: ''
      });
      setErrors({});
      
      onSuccess();

      if (createAnother) {
        // Keep modal open for another task
        // Form is already reset above
      } else {
        // Close modal and redirect to dashboard
        onClose();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating custom task:', error);
      addToast({
        title: 'Error',
        description: (error as Error).message,
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      duration: '15min',
      category: 'custom',
      description: ''
    });
    setErrors({});
    onClose();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    // Only handle special key combinations, let normal navigation work
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter submits and goes to dashboard
      e.preventDefault();
      handleSubmit(false);
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift + Enter submits and adds another
      e.preventDefault();
      handleSubmit(true);
    }
    // Let all other keys (including Tab) work normally
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-default-900">Create Custom Task</h2>
          <p className="text-sm text-default-600">
            Add a personal task to your daily routine that will appear alongside your other tasks.
          </p>
        </ModalHeader>
        
        <ModalBody className="gap-4" onKeyDown={handleFormKeyDown}>
          <Input
            label="Task Title"
            placeholder="e.g., Read 20 pages, Call mom, Review finances"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            isInvalid={!!errors.title}
            errorMessage={errors.title}
            isRequired
            autoFocus
            tabIndex={1}
          />

          <Select
            label="Duration"
            placeholder="Select duration"
            selectedKeys={new Set([formData.duration])}
            onSelectionChange={(keys) => {
              const duration = Array.from(keys)[0] as string;
              setFormData(prev => ({ ...prev, duration }));
            }}
            isInvalid={!!errors.duration}
            errorMessage={errors.duration}
            isRequired
            tabIndex={2}
          >
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Category"
            placeholder="Select a wellness category"
            selectedKeys={new Set([formData.category])}
            onSelectionChange={(keys) => {
              const category = Array.from(keys)[0] as WellnessCategory;
              setFormData(prev => ({ ...prev, category }));
            }}
            tabIndex={3}
            isRequired
          >
            {WELLNESS_OPTIONS.map((option) => (
              <SelectItem 
                key={option.key}
                description={option.description}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Textarea
            label="Description"
            placeholder="Describe what this task involves and why it's important to you..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
            maxRows={6}
            isInvalid={!!errors.description}
            errorMessage={errors.description}
            isRequired
            tabIndex={4}
          />

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How Custom Tasks Work
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Your custom task will appear daily in your task list</li>
              <li>• It will be color-coded based on the category you choose</li>
              <li>• You can complete, mark as missed, or delete it like any other task</li>
              <li>• Custom tasks are permanent and don't expire like routine stages</li>
              <li>• Use Tab to navigate between fields</li>
              <li>• Keyboard shortcuts: Cmd/Ctrl+Enter (create & go), Shift+Enter (create & add another)</li>
            </ul>
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button 
            variant="flat" 
            onPress={handleClose}
            isDisabled={isSubmitting}
            tabIndex={7}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              color="secondary" 
              variant="bordered"
              onPress={() => handleSubmit(true)}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
              tabIndex={5}
            >
              Create & Add Another
            </Button>
            <Button 
              color="primary" 
              onPress={() => handleSubmit(false)}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
              tabIndex={6}
            >
              Create & Go to Dashboard
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
