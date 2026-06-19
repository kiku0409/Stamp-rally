export type ProjectStatus = 'pending' | 'approved' | 'rejected';
export type ProjectRole = 'owner' | 'member';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  join_code?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  qr_token: string;
  description?: string;
  created_at: string;
  project_id?: string;
}

export interface Participant {
  id: string;
  nickname: string;
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
