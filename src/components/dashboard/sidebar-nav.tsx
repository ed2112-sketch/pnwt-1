"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  Ticket,
  ReceiptText,
  Banknote,
  Tag,
  CreditCard,
  Share2,
  MessageSquare,
  Mail,
  ContactRound,
  MapPin,
  Users,
  Settings,
  Code2,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Events",
    items: [
      { href: "/events", label: "Events", icon: Ticket },
      { href: "/venues", label: "Venues", icon: MapPin },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/orders", label: "Orders", icon: ReceiptText },
      { href: "/settlements", label: "Settlements", icon: Banknote },
      { href: "/promo-codes", label: "Promo Codes", icon: Tag },
      { href: "/gift-cards", label: "Gift Cards", icon: CreditCard },
      { href: "/referrals", label: "Referrals", icon: Share2 },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/surveys", label: "Surveys", icon: MessageSquare },
      { href: "/campaigns", label: "Campaigns", icon: Mail },
      { href: "/subscribers", label: "Subscribers", icon: ContactRound },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/settings/widget", label: "Widget", icon: Code2 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navSections.map((section) => (
        <div key={section.label}>
          <div className="pt-4 pb-1 px-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium select-none">
            {section.label}
          </div>
          {section.items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  className={isActive ? "rounded-lg bg-sidebar-accent font-semibold" : "rounded-lg"}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </div>
      ))}
    </SidebarMenu>
  );
}
