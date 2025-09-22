'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { addToast } from '@heroui/toast';
import { Plus, Sparkles } from 'lucide-react';
import { type WellnessCategory, WELLNESS_DESCRIPTIONS } from '@/lib/wellnessColors';

interface CustomTaskFormProps {
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

export default function CustomTaskForm({ onSuccess }: CustomTaskFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Reset form
      setFormData({
        title: '',
        duration: '15min',
        category: 'custom',
        description: ''
      });
      setErrors({});
      
      onSuccess();
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

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-default-900">Add Custom Task</h3>
        </div>
        <Sparkles className="h-4 w-4 text-primary-400 ml-auto" />
      </CardHeader>
      
      <CardBody className="space-y-4" onKeyDown={handleFormKeyDown}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g., Read 20 pages, Call mom"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            isInvalid={!!errors.title}
            errorMessage={errors.title}
            isRequired
            size="sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Duration"
              placeholder="Select duration"
              selectedKeys={new Set([formData.duration])}
              onSelectionChange={(keys) => {
                const [duration] = Array.from(keys);
                if (typeof duration !== 'string') {
                  return;
                }
                setFormData(prev => ({ ...prev, duration }));
              }}
              isInvalid={!!errors.duration}
              errorMessage={errors.duration}
              isRequired
              size="sm"
            >
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Category"
              placeholder="Select category"
              selectedKeys={new Set([formData.category])}
              onSelectionChange={(keys) => {
                const [category] = Array.from(keys);
                if (!category) {
                  return;
                }
                setFormData(prev => ({ ...prev, category: category as WellnessCategory }));
              }}
              isRequired
              size="sm"
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
          </div>

          <Textarea
            label="Description"
            placeholder="Describe what this task involves..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
            maxRows={4}
            isInvalid={!!errors.description}
            errorMessage={errors.description}
            isRequired
            size="sm"
          />

          <Button 
            type="submit"
            color="primary" 
            className="w-full"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
            startContent={!isSubmitting ? <Plus className="h-4 w-4" /> : undefined}
          >
            {isSubmitting ? 'Creating...' : 'Add Task'}
          </Button>
        </form>

        <div className="bg-primary-50 dark:bg-primary-950/30 p-3 rounded-lg">
          <p className="text-xs text-primary-800 dark:text-primary-200">
            <strong>Tip:</strong> Custom tasks appear daily and can be completed, missed, or deleted. Use Cmd/Ctrl+Enter to quickly submit.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
