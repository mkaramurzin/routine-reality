"use client";

import { useState } from "react";
import Link from "next/link";
import { Github, Twitter, Mail, ExternalLink } from "lucide-react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/modal";

export default function Footer() {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return alert("Please enter your feedback");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim(), email: email.trim() || null }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Thank you for your feedback!");
        setFeedback("");
        setEmail("");
      } else {
        throw new Error(data.error || "Failed to submit");
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-default-50 dark:bg-default-100">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <p className="text-default-600 dark:text-default-400">
          &copy; {new Date().getFullYear()} Routine Reality. Built with ❤️ for better habits.
        </p>

        <div className="flex items-center gap-6">
          <Link href="/terms" className="text-default-600 dark:text-default-400 hover:text-primary-500 transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-default-600 dark:text-default-400 hover:text-primary-500 transition-colors">
            Privacy
          </Link>

          {/* Feedback Modal Trigger */}
          <button onClick={onOpen} className="text-default-600 dark:text-default-400 hover:text-primary-500 transition-colors">Feedback</button>
          
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
              <ModalHeader>
                <h3 className="text-lg font-semibold">Share Your Feedback</h3>
              </ModalHeader>

              <ModalBody>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <Textarea
                    label="Your Feedback"
                    placeholder="Tell us what you think..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    label="Email (Optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      color="primary"
                      isLoading={isSubmitting}
                      endContent={!isSubmitting && <ExternalLink className="h-4 w-4" />}
                    >
                      {isSubmitting ? "Sending..." : "Send Feedback"}
                    </Button>
                  </div>
                </form>
              </ModalBody>
            </ModalContent>
          </Modal>
        </div>
      </div>
    </footer>
  );
}