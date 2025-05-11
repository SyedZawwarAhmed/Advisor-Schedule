'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { EmailSetupModal } from "@/components/email-setup-modal";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  useEffect(() => {
    // Check if we need to show the email setup modal
    const checkEmailSetup = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/settings/email");
          if (response.ok) {
            const data = await response.json();
            // If no email host is configured, show the setup modal
            if (!data.emailHost) {
              setShowEmailSetup(true);
            }
          }
        } catch (error) {
          console.error("Error checking email settings:", error);
        }
      }
    };

    checkEmailSetup();
  }, [session]);

  return (
    <>
      {children}
      {session?.user?.email && (
        <EmailSetupModal
          isOpen={showEmailSetup}
          onClose={() => setShowEmailSetup(false)}
          userEmail={session.user.email}
        />
      )}
    </>
  );
} 