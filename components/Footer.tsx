"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Github, Twitter, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      // Simple alert for now, can be enhanced with a proper toast system later
      alert("Please enter your feedback");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Thank you for your feedback!");
        setFeedback("");
        setEmail("");
      } else {
        throw new Error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-default-50 dark:bg-default-900 border-t border-default-200 dark:border-default-800">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand & Navigation */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-default-900 dark:text-default-50 mb-4">
                Routine Reality
              </h3>
              <p className="text-default-600 dark:text-default-400 text-sm">
                Smart wellness tracking for a better you.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-default-800 dark:text-default-200 mb-3">
                Quick Links
              </h4>
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/routines"
                  className="block text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                >
                  Routines
                </Link>
                <Link
                  href="/ui-playground"
                  className="block text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                >
                  UI Playground
                </Link>
              </nav>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold text-default-800 dark:text-default-200 mb-3">
                Connect
              </h4>
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="mailto:hello@routinereality.com"
                  className="text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <Card className="bg-default-100 dark:bg-default-800 border-default-200 dark:border-default-700">
              <CardBody className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-default-800 dark:text-default-200 mb-2">
                    Share Your Feedback
                  </h4>
                  <p className="text-default-600 dark:text-default-400 text-sm">
                    Help us improve Routine Reality. Your thoughts matter!
                  </p>
                </div>
                
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <Textarea
                    label="Your Feedback"
                    placeholder="Tell us what you think, what's working well, or what could be better..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    minRows={3}
                    maxRows={5}
                    className="w-full"
                    required
                  />
                  
                  <Input
                    type="email"
                    label="Email (Optional)"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    description="We'll only use this to follow up if needed"
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      color="primary"
                      isLoading={isSubmitting}
                      disabled={!feedback.trim()}
                      endContent={!isSubmitting && <ExternalLink className="h-4 w-4" />}
                    >
                      {isSubmitting ? "Sending..." : "Send Feedback"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-default-200 dark:border-default-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-default-500 dark:text-default-500 text-sm">
              &copy; {new Date().getFullYear()} Routine Reality. Built with ❤️ for better habits.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href="/terms"
                className="text-default-500 dark:text-default-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-default-500 dark:text-default-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="text-default-500 dark:text-default-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 