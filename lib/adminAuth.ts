const ADMIN_STORAGE_KEY = 'stamp_rally_admin_pw';

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(ADMIN_STORAGE_KEY) || '';
}

export function setAdminPassword(password: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ADMIN_STORAGE_KEY, password);
}

export function clearAdminPassword(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/stats', {
    headers: { 'x-admin-password': password },
  });
  return res.ok;
}
