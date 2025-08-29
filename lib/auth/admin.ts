export function checkAdminAuth(cookies: any) {
  const authToken = cookies.get("auth-token");
  const adminClaim = cookies.get("admin-claim");
  return authToken && adminClaim?.value === "true";
}

export function logAdminAccess(user: string, route: string) {
  console.log("[AUDIT]", {
    user,
    route,
    timestamp: new Date().toISOString()
  });
}