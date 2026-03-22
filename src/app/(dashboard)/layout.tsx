import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.orgId) redirect("/onboarding");

  const orgName = session.user.orgName ?? "PNWTickets";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="relative px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {orgName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-sm truncate">
                {orgName}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
              <SidebarNav />
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <UserNav user={session.user} />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="animate-fade-in-up">
            <Breadcrumbs />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
