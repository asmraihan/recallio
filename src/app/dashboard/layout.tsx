"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-[52px] items-center justify-between py-4 px-4 md:px-6">
            <h1 className="text-lg font-semibold">Recallio</h1>
            <UserNav user={session?.user} />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 pt-2 md:p-8 md:pt-6 mb-12">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}