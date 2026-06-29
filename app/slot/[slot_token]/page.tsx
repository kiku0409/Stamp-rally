import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';

interface SlotPageProps {
  params: Promise<{ slot_token: string }>;
}

function formatJST(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SlotPage({ params }: SlotPageProps) {
  const { slot_token } = await params;
  const supabase = createAdminClient();

  const { data: slot } = await supabase
    .from('slots')
    .select('id, name')
    .eq('slot_token', slot_token)
    .maybeSingle();

  if (!slot) {
    return <SlotError title="無効なQRコード" message="このQRコードは存在しません。" />;
  }

  const now = new Date().toISOString();

  const { data: schedule } = await supabase
    .from('slot_schedules')
    .select('*, event:events(qr_token, title)')
    .eq('slot_id', slot.id)
    .lte('start_at', now)
    .gte('end_at', now)
    .order('start_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (schedule?.event) {
    redirect(`/event/${(schedule.event as { qr_token: string }).qr_token}/stamp`);
  }

  // 時間外 — 次のスケジュールを探す
  const { data: next } = await supabase
    .from('slot_schedules')
    .select('start_at, event:events(title)')
    .eq('slot_id', slot.id)
    .gt('start_at', now)
    .order('start_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextMsg = next
    ? `次の受付開始: ${formatJST(next.start_at)} 〜`
    : null;

  return (
    <SlotError
      title="現在スキャン受付時間外です"
      message={`「${slot.name}」は現在スキャンを受け付けていません。`}
      sub={nextMsg ?? undefined}
    />
  );
}

function SlotError({ title, message, sub }: { title: string; message: string; sub?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F1F8F7' }}>
      <div className="bg-white rounded-2xl shadow-md px-6 py-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏰</span>
        </div>
        <h1 className="text-[17px] font-bold text-ink mb-2">{title}</h1>
        <p className="text-[14px] text-muted mb-3">{message}</p>
        {sub && <p className="text-[13px] text-accent font-medium">{sub}</p>}
      </div>
    </div>
  );
}
