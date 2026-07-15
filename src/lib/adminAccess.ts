/** ShiftED trainer admin accounts use @admin.com emails with admin role in user_roles. */
export function isTrainerAdminEmail(email: string | undefined | null): boolean {
  return (email || "").trim().toLowerCase().endsWith("@admin.com");
}

export type AdminRoleRow = { role: string };

export function hasAdminRole(rows: AdminRoleRow[] | null | undefined): boolean {
  return !!rows?.some((row) => row.role === "admin");
}
