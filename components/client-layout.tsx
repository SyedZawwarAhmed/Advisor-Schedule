'use client';

import { useSession } from "next-auth/react";
import { InitialCalendarSetup } from "@/components/initial-calendar-setup";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <>
      {children}
      {session?.user?.email && <InitialCalendarSetup />}
    </>
  );
} 