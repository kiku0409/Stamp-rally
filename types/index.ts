export type ProjectStatus = 'pending' | 'approved' | 'rejected';
export type ProjectRole = 'owner' | 'member';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  join_code?: string;
  reject_reason?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  theme_id?: string;
  banner_url?: string;
  venue_map_url?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
}

export interface RewardTier {
  id: string;
  project_id: string;
  threshold: number;
  label: string;
  created_at: string;
}

export interface ParticipantReward {
  id: string;
  participant_id: string;
  tier_id: string;
  project_id: string;
  redeem_code?: string;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
  issued_at: string;
}

// 来場者スタンプ帳のプロジェクト単位集約（/api/stamp-book）
export interface StampBookTier {
  id: string;
  threshold: number;
  label: string;
  earned: boolean;
}

export interface StampBookReward {
  label: string;
  issued_at: string;
  redeem_code: string;
  redeemed_at: string | null;
}

export interface StampBookGroup {
  project: { id: string; name: string; theme_id?: string; banner_url?: string; venue_map_url?: string };
  count: number;
  stamps: EventStamp[];
  tiers: StampBookTier[];
  rewards: StampBookReward[];
}

export interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  qr_token: string;
  description?: string;
  icon_url?: string;
  created_at: string;
  project_id?: string;
}

export interface Participant {
  id: string;
  nickname: string;
  recovery_code?: string;
  gender?: string;
  age_group?: string;
  created_at: string;
}

export interface EventStamp {
  id: string;
  participant_id: string;
  event_id: string;
  stamped_at: string;
  event?: Event;
}

export interface LocalParticipant {
  participant_id: string;
  nickname: string;
  recovery_code?: string;
  gender?: string;
  age_group?: string;
}

export interface StampResult {
  success: boolean;
  alreadyStamped: boolean;
  stamp?: EventStamp;
  event?: Event;
  message?: string;
}

export interface AdminStats {
  eventId: string;
  participantCount: number;
  stampCount: number;
}
