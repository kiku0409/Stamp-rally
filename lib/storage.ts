import { LocalParticipant } from '@/types';

const STORAGE_KEY = 'stamp_rally_participant';

export function getLocalParticipant(): LocalParticipant | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setLocalParticipant(participant: LocalParticipant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participant));
}

export function clearLocalParticipant(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
