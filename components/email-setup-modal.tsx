"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const appPasswordSchema = z.object({
  appPassword: z.string().min(16, "App Password must be at least 16 characters"),
});

type AppPasswordForm = z.infer<typeof appPasswordSchema>;

interface EmailSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function EmailSetupModal({ isOpen, onClose, userEmail }: EmailSetupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<AppPasswordForm>({
    resolver: zodResolver(appPasswordSchema),
    defaultValues: {
      appPassword: "",
    },
  });

  const onSubmit = async (data: AppPasswordForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailHost: "smtp.gmail.com",
          emailPort: 587,
          emailSecure: false,
          emailUsername: userEmail,
          emailPassword: data.appPassword,
          emailFrom: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save email settings");
      }

      toast.success("Email settings configured successfully");
      onClose();
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast.error("Failed to configure email settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Set Up Email Notifications</DialogTitle>
          <DialogDescription>
            To send meeting notifications, we need to set up your Gmail account.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll need to create an App Password for your Gmail account.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Steps to create an App Password:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Google Account settings</li>
                <li>Navigate to Security</li>
                <li>Under "2-Step Verification", click on "App passwords"</li>
                <li>Select "Mail" as the app and "Other" as the device</li>
                <li>Enter "Advisor Schedule" as the name</li>
                <li>Click "Generate"</li>
                <li>Copy the 16-character password that appears</li>
              </ol>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              I've Created an App Password
            </Button>
          </div>
        )}

        {step === 2 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="appPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gmail App Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your 16-character app password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste the 16-character app password you generated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 