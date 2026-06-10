import { redirect } from 'next/navigation';

// Redirect /event/[qr_token] → /event/[qr_token]/stamp
export default async function EventPage({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}) {
  const { qr_token } = await params;
  redirect(`/event/${qr_token}/stamp`);
}
