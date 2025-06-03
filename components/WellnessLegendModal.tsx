"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { WELLNESS_COLORS, WELLNESS_DESCRIPTIONS, type WellnessCategory } from "@/lib/wellnessColors";

interface WellnessLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WellnessLegendModal: React.FC<WellnessLegendModalProps> = ({ isOpen, onClose }) => {
  const categories = Object.keys(WELLNESS_COLORS) as WellnessCategory[];

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
            <h4 className="font-medium text-default-900 mb-2">How to Use</h4>
            <div className="space-y-2 text-sm text-default-600">
              <div className="flex items-start gap-2">
                <span className="font-medium">Tasks:</span>
                <span>Single color background for 1 category, diagonal split for 2 categories (max)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">Routines:</span>
                <span>Colored borders with up to 4 categories distributed around the card edges</span>
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