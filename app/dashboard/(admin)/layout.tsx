import RoleGuard from "@/components/RoleGuard";

/**
 * Admin route group layout.
 * Protects all routes under dashboard/(admin)/* so that only
 * users with the "admin" role can access them.
 * Non-admins are redirected to /dashboard.
 */
export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}
