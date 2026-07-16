import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-neutral-200/60 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Workspace / Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Divider */}
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Profile Dropdown */}
            <UserProfileMenu user={session.user} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
