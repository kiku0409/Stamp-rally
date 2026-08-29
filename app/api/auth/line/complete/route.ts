import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';
import { LINE_AUTH_COOKIE, authCookieOptions, decodeLineAuth } from '@/lib/lineAuth';
import { resolveAgeFields } from '@/lib/participantAge';

// LINE認証後の紐付け本体。line_user_id(sub)は署名付きcookieからのみ取得し、
// リクエストbody・レスポンス・localStorageには一切載せない（クライアントはline_linkedのみ）。
//
// 分岐:
//   linked     … 既存参加者(participant_id)にLINEを紐付けた
//   new        … このLINEは未登録かつ端末にも参加者なし → クライアントは登録フォームを表示
//   registered … 登録フォームからの2回目呼び出しで参加者を新規作成した
//   restored   … このLINEに紐付いた参加者が既にいる → その参加者を返す（別端末での復元）
//   conflict   … このLINEは別参加者に紐付き済みかつ端末に別参加者がいる → 自動付け替えせず返す

const PARTICIPANT_COLUMNS = 'id, nickname, recovery_code, gender, age, age_group';

interface ParticipantRow {
  id: string;
  nickname: string;
  recovery_code: string;
  gender: string | null;
  age: number | null;       // 実年齢（整数）。新形式
  age_group: string | null; // [DEPRECATED] 旧形式。表示フォールバック用
}

export async function POST(request: NextRequest) {
  const auth = decodeLineAuth(request.cookies.get(LINE_AUTH_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json(
      { error: 'LINE認証の有効期限が切れました。もう一度お試しください' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { participant_id, nickname, gender, age, age_group } = body ?? {};

  const supabase = createAdminClient();

  // このLINEアカウントに紐付いた参加者を検索
  const { data: linked, error: findError } = await supabase
    .from('participants')
    .select(PARTICIPANT_COLUMNS)
    .eq('line_user_id', auth.sub)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

  if (linked) {
    const status = participant_id && participant_id !== linked.id ? 'conflict' : 'restored';
    return participantResponse(status, linked);
  }

  if (participant_id) {
    // (a) 既存参加者にLINEを紐付け（participant_idの所持=本人という既存PATCHと同じ信頼モデル）
    const { data: existing, error } = await supabase
      .from('participants')
      .select(PARTICIPANT_COLUMNS)
      .eq('id', participant_id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: '参加者が見つかりません' }, { status: 404 });

    const { error: updateError } = await supabase
      .from('participants')
      .update({ line_user_id: auth.sub })
      .eq('id', participant_id);
    if (updateError) {
      // レースで同じLINEが先に別参加者へ紐付いた場合(23505)は再検索して返す
      if (updateError.code === '23505') {
        const { data: winner } = await supabase
          .from('participants')
          .select(PARTICIPANT_COLUMNS)
          .eq('line_user_id', auth.sub)
          .maybeSingle();
        if (winner) {
          return participantResponse(winner.id === participant_id ? 'restored' : 'conflict', winner);
        }
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return participantResponse('linked', existing);
  }

  if (!nickname?.trim()) {
    // (b) 新規1回目: 登録フォームを出させる。cookieは2回目のために維持する
    return NextResponse.json({ status: 'new', suggested_nickname: auth.name ?? '' });
  }

  // (b') 新規2回目: 参加者を作成してLINEを紐付け
  const baseData: Record<string, string | number> = { nickname: nickname.trim(), line_user_id: auth.sub };
  if (gender) baseData.gender = gender;
  // 移行期間中は age(INTEGER) と age_group(TEXT) の両方に書き込む（/api/participants POST と同じ）
  const ageFields = resolveAgeFields(age, age_group);
  if (ageFields.age !== undefined) baseData.age = ageFields.age;
  if (ageFields.age_group !== undefined) baseData.age_group = ageFields.age_group;

  // recovery_code の一意制約違反(23505)時は再採番してリトライ（/api/participants POST と同じ）
  let participant: ParticipantRow | null = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('participants')
      .insert({ ...baseData, recovery_code: generateCode(12) })
      .select(PARTICIPANT_COLUMNS)
      .single();
    if (!error) { participant = data; break; }
    lastError = error;
    if (error.code !== '23505') break;
    // 23505 が line_user_id 衝突（同一LINEの並行登録）なら再採番しても解決しないので、
    // 紐付き先を探して復元として返す
    const { data: raced } = await supabase
      .from('participants')
      .select(PARTICIPANT_COLUMNS)
      .eq('line_user_id', auth.sub)
      .maybeSingle();
    if (raced) return participantResponse('restored', raced);
  }

  if (!participant) {
    return NextResponse.json({ error: lastError?.message ?? '登録に失敗しました' }, { status: 500 });
  }

  return participantResponse('registered', participant);
}

function participantResponse(status: string, row: ParticipantRow) {
  const res = NextResponse.json({ status, participant: { ...row, line_linked: true } });
  // フロー完了。認証cookieは使い切りなので削除する
  res.cookies.set(LINE_AUTH_COOKIE, '', authCookieOptions(0));
  return res;
}
