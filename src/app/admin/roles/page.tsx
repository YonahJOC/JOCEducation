import { UsersGuard } from "@/components/admin/Guard";
import { ensureAdminRoles, listAdminRoles } from "@/lib/admin-roles";
import { usingSampleData } from "@/lib/admin-data";
import { RolesClient } from "./RolesClient";

export const metadata = { title: "Admin types — JOC Console" };

export default async function AdminRolesPage() {
  return <UsersGuard>{await Inner()}</UsersGuard>;
}

async function Inner() {
  // The four that ship are created on first visit, so a fresh database is
  // never left with nothing to assign.
  await ensureAdminRoles();
  const roles = await listAdminRoles();
  return <RolesClient roles={roles} disabled={usingSampleData} />;
}
