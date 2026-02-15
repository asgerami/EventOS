import { requireSuperAdmin } from "@/lib/auth-utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return <>{children}</>;
}
