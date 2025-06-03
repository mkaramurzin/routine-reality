"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Palette, Eye, EyeOff } from "lucide-react";
import { WELLNESS_COLORS, WELLNESS_DESCRIPTIONS, type WellnessCategory } from "@/lib/wellnessColors";

interface WellnessLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WellnessLegendModal: React.FC<WellnessLegendModalProps> = ({ isOpen, onClose }) => {
  const categories = Object.keys(WELLNESS_COLORS) as WellnessCategory[];
  const [isColorCodingEnabled, setIsColorCodingEnabled] = useState(false);

  // Load color-coding preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('wellnessColorCoding');
    setIsColorCodingEnabled(savedPreference === 'true');
  }, []);

  // Save color-coding preference to localStorage and dispatch event
  const handleColorCodingToggle = (enabled: boolean) => {
    setIsColorCodingEnabled(enabled);
    localStorage.setItem('wellnessColorCoding', enabled.toString());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('wellnessColorCodingChanged', { 
      detail: { enabled } 
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">Wellness Categories Legend</h3>
          <p className="text-sm text-default-500">
            Understanding the color-coded system across your tasks and routines
          </p>
        </ModalHeader>
        
        <ModalBody className="py-6">
          {/* Color Coding Toggle */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                  <Palette className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-default-900">Task Card Color-Coding</h4>
                  <p className="text-sm text-default-600">
                    {isColorCodingEnabled 
                      ? "Task cards show wellness category colors" 
                      : "Task cards use neutral colors for better focus"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isColorCodingEnabled ? (
                  <Eye className="h-4 w-4 text-primary-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-default-400" />
                )}
                <Switch
                  isSelected={isColorCodingEnabled}
                  onValueChange={handleColorCodingToggle}
                  color="primary"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <Card key={category} className="border border-default-200 hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Color Swatch */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: WELLNESS_COLORS[category] }}
                      ></div>
                    </div>
                    
                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-default-900 capitalize mb-1">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-default-600">
                        {WELLNESS_DESCRIPTIONS[category]}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          
          {/* Usage Info */}
          <div className="mt-6 p-4 bg-default-100 rounded-lg">
            <h4 className="font-medium text-default-900 mb-2">How It Works</h4>
            <div className="space-y-2 text-sm text-default-600">
              <div className="flex items-start gap-2">
                <span className="font-medium">Task Cards:</span>
                <span>
                  {isColorCodingEnabled 
                    ? "Single color background for 1 category, diagonal split for 2 categories (max)" 
                    : "Neutral backgrounds regardless of categories (toggle above to enable colors)"
                  }
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">Routine Cards:</span>
                <span>Always show colored borders with up to 4 categories distributed around the card edges</span>
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button color="primary" variant="solid" onPress={onClose}>
            Got it!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WellnessLegendModal; 