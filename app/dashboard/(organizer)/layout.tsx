import RoleGuard from "@/components/RoleGuard";

/**
 * Organizer route group layout.
 * Protects all routes under dashboard/(organizer)/* so that only
 * users with the "organizer" role can access them.
 * Non-matching roles are redirected to /dashboard.
 */
export default function OrganizerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["organizer"]}>{children}</RoleGuard>;
}
