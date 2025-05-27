'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { AVAILABLE_ROUTINES, createRoutineForUser, type RoutineKey } from '@/lib/routineLibrary';

export default function SelectRoutinePage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectRoutine = async (routineKey: RoutineKey) => {
    if (!user?.id) {
      console.error('No user found');
      return;
    }

    setSelectedRoutine(routineKey);
    setIsCreating(true);

    try {
      await createRoutineForUser(routineKey);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create routine:', error);
      setSelectedRoutine(null);
      setIsCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose a Routine
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select a routine that matches your goals and commitment level. 
            You can have multiple active routines and customize them later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_ROUTINES.map((routine) => (
            <Card 
              key={routine.key}
              className="hover:shadow-lg transition-shadow duration-200"
              isPressable={!isCreating}
            >
              <CardBody className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {routine.title}
                  </h3>
                  <Badge 
                    color={getDifficultyColor(routine.difficulty)}
                    variant="flat"
                    size="sm"
                  >
                    {routine.difficulty}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {routine.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">{routine.duration}</span>
                </div>
              </CardBody>
              
              <CardFooter className="pt-0 px-6 pb-6">
                <Button
                  color="primary"
                  variant="solid"
                  className="w-full"
                  onPress={() => handleSelectRoutine(routine.key as RoutineKey)}
                  isLoading={isCreating && selectedRoutine === routine.key}
                  isDisabled={isCreating}
                >
                  {isCreating && selectedRoutine === routine.key 
                    ? 'Setting up...' 
                    : 'Add This Routine'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            Need help deciding? Start with a Beginner routine and work your way up.
          </p>
        </div>
      </div>
    </div>
  );
} 