"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { useTheme } from "next-themes";
import TaskCard from "../../components/TaskCard";
import { Sun, Moon } from "lucide-react";

export default function UIPlayground() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const [taskStatuses, setTaskStatuses] = useState<{[key: string]: "todo" | "completed" | "missed"}>({});

  // Wellness categories with their colors
  const categories = [
    { name: "Overall Health", color: "#1E90FF" },
    { name: "Brainy", color: "#FF2D95" },
    { name: "Body", color: "#E74C3C" },
    { name: "Money", color: "#1E5C3A" },
    { name: "Personal Growth", color: "#2ECC71" },
    { name: "Body Maintenance", color: "#9B59B6" },
    { name: "Custom", color: "#7F8C8D" },
  ];

  // Example tasks for each category
  const exampleTasks = categories.map((category, index) => {
    const id = `task-${index}`;
    // Use the stored status if available, otherwise use the default status
    const defaultStatus = index % 3 === 0 ? "completed" : index % 4 === 0 ? "missed" : "todo";
    const status = taskStatuses[id] || defaultStatus;
    
    return {
      id,
      title: `${category.name} Task Example`,
      description: `This is an example task for the ${category.name} category`,
      status
    };
  });

  const handleCompleteTask = (taskId: string) => {
    console.log(`Task ${taskId} marked as complete`);
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: "completed"
    }));
  };

  const handleMissedTask = (taskId: string) => {
    console.log(`Task ${taskId} marked as missed`);
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: "missed"
    }));
  };

  const handleUndoTask = (taskId: string) => {
    console.log(`Task ${taskId} reset to default state`);
    setTaskStatuses(prev => ({
      ...prev,
      [taskId]: "todo"
    }));
  };

  // This effect ensures theme toggle works after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Force theme debug function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Apply class directly to HTML element as a backup
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      if (newTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
    
    console.log("Theme toggled to:", newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">UI Component Playground</h1>
        <p className="text-lg text-muted-foreground">
          A showcase of HeroUI components and design elements for Routine Reality
        </p>
        <div className="mt-2 text-sm">Current theme: {theme}</div>
      </header>

      {/* Theme Toggle */}
      <div className="mb-10 flex justify-end">
        <Button 
          variant="flat" 
          color="primary" 
          onClick={toggleTheme}
          className="flex items-center gap-2"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      {/* Buttons Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="solid" color="primary">Primary Button</Button>
          <Button variant="flat" color="primary">Secondary Button</Button>
          <Button variant="bordered" color="danger">Destructive Button</Button>
          <Button variant="ghost" color="primary">Ghost Button</Button>
          <Button variant="solid" color="primary" isDisabled>Disabled Button</Button>
          <Button variant="solid" color="success">Success Button</Button>
        </div>
      </section>

      {/* Category Task Cards Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Wellness Category Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card key={category.name} className="shadow-md overflow-hidden">
              <div className="h-2" style={{ backgroundColor: category.color }}></div>
              <CardHeader className="flex flex-row items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                <h3 className="text-xl font-medium">{category.name}</h3>
              </CardHeader>
              <CardBody>
                <p>Track your {category.name.toLowerCase()} routines and habits with our intuitive task management system.</p>
              </CardBody>
              <CardFooter>
                <Button 
                  variant="flat" 
                  size="sm" 
                  style={{ 
                    color: category.color,
                    borderColor: category.color
                  }}
                >
                  View Tasks
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Task Cards Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Task Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <div key={`task-${index}`} className="relative">
              <div className="absolute -left-3 top-0 bottom-0 w-1" style={{ backgroundColor: category.color }}></div>
              <TaskCard 
                task={{
                  ...exampleTasks[index],
                  categoryColor: category.color
                }}
                onComplete={handleCompleteTask}
                onMissed={handleMissedTask}
                onUndo={handleUndoTask}
                currentTheme={theme as "light" | "dark"}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Form Inputs Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="category">Category</label>
              <Listbox
                id="category"
                selectedKeys={selectValue ? [selectValue] : []}
                onSelectionChange={(keys) => {
                  const selected = [...keys][0];
                  setSelectValue(selected as string);
                }}
              >
                <ListboxItem key="health">Health & Wellness</ListboxItem>
                <ListboxItem key="productivity">Productivity</ListboxItem>
                <ListboxItem key="fitness">Fitness</ListboxItem>
                <ListboxItem key="mindfulness">Mindfulness</ListboxItem>
              </Listbox>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
            <Textarea 
              id="description" 
              placeholder="Enter a description" 
              className="min-h-[150px]"
            />
          </div>
        </div>
      </section>

      {/* Additional UI Elements Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Additional UI Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Alert/Notice Card */}
          <Card className="shadow-md border-l-4 border-blue-500">
            <CardBody>
              <h3 className="text-lg font-medium mb-2">Information Notice</h3>
              <p>This is an example of an information notice or alert component.</p>
            </CardBody>
          </Card>

          {/* Success Card */}
          <Card className="shadow-md border-l-4 border-green-500">
            <CardBody>
              <h3 className="text-lg font-medium mb-2">Success Notice</h3>
              <p>This is an example of a success notice or confirmation message.</p>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
} 