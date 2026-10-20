import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "DOCTOR") redirect("/doctor/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.doctorAccessRequested) redirect("/doctor-registration");
  return <WorkspaceShell user={session.user}>{children}</WorkspaceShell>;
}
