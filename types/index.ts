export interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  qr_token: string;
  description?: string;
  created_at: string;
}

export interface Participant {
  id: string;
  nickname: string;
  birth_decade: string | null;
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
