import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Your account" };
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, role: true, passwordHash: true, doctorAccessRequested: true } });
  if (!user) redirect("/login");
  return <WorkspaceShell user={session.user}><div className="space-y-6"><div><h1 className="font-serif text-3xl">Your account</h1><p className="mt-2 text-sm text-neutral-500">Keep your details up to date.</p></div>{user.doctorAccessRequested && <p role="status" className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">Doctor registration · Approval pending.</p>}<AccountForm name={user.name || ""} email={user.email} role={user.role} hasPassword={!!user.passwordHash} doctorAccessRequested={user.doctorAccessRequested} /></div></WorkspaceShell>;
}
