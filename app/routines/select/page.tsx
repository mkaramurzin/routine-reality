'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import Navbar from '@/components/Navbar';
import { AVAILABLE_ROUTINES, createRoutineForUser, type RoutineKey } from '@/lib/routineLibrary';
import { getRoutineBorderColors } from '@/lib/wellnessColors';

// Type for user routine from database
interface UserRoutine {
  id: string;
  title: string;
  routineInfo: string;
  routineType: string;
  startDate: string;
  endDate: string;
  stages: number;
  thresholds: number[];
  currentStage: number;
  currentStageProgress: number;
  status: "active" | "paused" | "finished" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

export default function SelectRoutinePage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);

  // Fetch user's existing routines on page load
  useEffect(() => {
    const fetchUserRoutines = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/routines');
        if (response.ok) {
          const routines = await response.json();
          setUserRoutines(routines);
        }
      } catch (error) {
        console.error('Failed to fetch user routines:', error);
      } finally {
        setIsLoadingRoutines(false);
      }
    };

    fetchUserRoutines();
  }, [user?.id]);

  // Check if user already has a specific routine
  const isRoutineAlreadyOwned = (routineTitle: string): boolean => {
    return userRoutines.some(userRoutine => {
      // Handle the special case where Monk Mode is stored as "|Monk Mode|"
      const normalizedUserTitle = userRoutine.title.replace(/^\||\|$/g, '');
      return normalizedUserTitle === routineTitle;
    });
  };

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

  // Serialize user data for navbar
  const serializedUser = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        username: user.username,
        emailAddress: user.emailAddresses?.[0]?.emailAddress,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-default-50">
      <Navbar user={serializedUser} />

      <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-default-900 mb-4">
              Choose a Routine
            </h1>
            <p className="text-xl text-default-600 max-w-2xl mx-auto">
              Select a routine that matches your goals and commitment level. 
              You can have multiple active routines and customize them later.
            </p>
          </div>

          {isLoadingRoutines ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-default-500">Loading your routines...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_ROUTINES.map((routine) => {
                  const isOwned = isRoutineAlreadyOwned(routine.title);
                  const isDisabled = isCreating || isOwned;
                  const borderColors = getRoutineBorderColors(routine.wellnessCategories);
                  
                  return (
                    <Card 
                      key={routine.key}
                      className={`hover:shadow-lg transition-shadow duration-200 ${
                        isOwned ? 'grayscale opacity-60 cursor-not-allowed' : ''
                      } ${
                        routine.wellnessCategories.length > 0 ? 'border-4' : 'border border-default-200'
                      }`}
                      style={{
                        ...(routine.wellnessCategories.length > 0 && !isOwned && {
                          borderTopColor: borderColors.borderTopColor,
                          borderRightColor: borderColors.borderRightColor,
                          borderBottomColor: borderColors.borderBottomColor,
                          borderLeftColor: borderColors.borderLeftColor,
                        })
                      }}
                      isPressable={!isDisabled}
                    >
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-default-900">
                            {routine.title}
                          </h3>
                          <div className="flex gap-2">
                            <Badge 
                              color={getDifficultyColor(routine.difficulty)}
                              variant="flat"
                              size="sm"
                            >
                              {routine.difficulty}
                            </Badge>
                            {isOwned && (
                              <Badge 
                                color="success"
                                variant="flat"
                                size="sm"
                              >
                                Owned
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-default-600 mb-4 leading-relaxed">
                          {routine.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-default-500">
                          <span className="font-medium">Duration:</span>
                          <span className="ml-2">{routine.duration}</span>
                        </div>
                      </CardBody>
                      
                      <CardFooter className="pt-0 px-6 pb-6">
                        <Button
                          color={isOwned ? "default" : "primary"}
                          variant={isOwned ? "flat" : "solid"}
                          className="w-full"
                          onPress={() => !isOwned && handleSelectRoutine(routine.key as RoutineKey)}
                          isLoading={isCreating && selectedRoutine === routine.key}
                          isDisabled={isDisabled}
                          aria-disabled={isOwned}
                          title={isOwned ? "You already have this routine" : undefined}
                        >
                          {isOwned 
                            ? 'Already Added'
                            : isCreating && selectedRoutine === routine.key 
                              ? 'Setting up...' 
                              : 'Add This Routine'
                          }
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center mt-12">
                <p className="text-default-500">
                  Need help deciding? Start with a Beginner routine and work your way up.
                  {userRoutines.length > 0 && (
                    <span className="block mt-2 text-sm">
                      Routines you already own are disabled and marked with an "Owned" badge.
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 