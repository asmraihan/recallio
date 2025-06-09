"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ListPlus, GraduationCap, Settings } from "lucide-react";

const navLinks = [
  {
    href: "/dashboard/words",
    label: "Words",
    icon: BookOpen,
  },
  {
    href: "/dashboard/words/add",
    label: "Add",
    icon: ListPlus,
  },
  {
    href: "/dashboard/learn",
    label: "Learn",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-background py-2 shadow md:hidden">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 text-xs px-2 py-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-6 w-6" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
} 