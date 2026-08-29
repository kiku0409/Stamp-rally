/**
 * 年齢入力の互換レイヤー（participants API と LINE 登録 API で共用）。
 * - 新形式: `age`（数値、または数値文字列）を優先
 * - 旧形式: `age_group`（数値文字列なら age に変換、「20代」等はそのまま保持）
 * 移行期間中は age(INTEGER) と age_group(TEXT) の両方に書き込み、
 * 旧リーダー（age_group を読むコード）を壊さない。
 */
export function resolveAgeFields(age: unknown, age_group: unknown): { age?: number; age_group?: string } {
  if (typeof age === 'number' && Number.isFinite(age)) {
    const n = Math.trunc(age);
    return { age: n, age_group: String(n) };
  }
  if (typeof age === 'string' && /^\d+$/.test(age)) {
    const n = parseInt(age, 10);
    return { age: n, age_group: String(n) };
  }
  if (typeof age_group === 'string' && age_group) {
    if (/^\d+$/.test(age_group)) {
      const n = parseInt(age_group, 10);
      return { age: n, age_group: String(n) };
    }
    // レガシー形式（「20代」等）は数値を推測せず age_group のみ保持
    return { age_group };
  }
  return {};
}
