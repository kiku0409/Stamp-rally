// 曖昧な文字（O/0/I/1）を除外したコード生成・整形ユーティリティ
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('');
}

// "ABCD-EFGH-IJKL" のように group 文字ごとに区切る（表示用）
export function formatGrouped(code: string, group = 4): string {
  return (code.match(new RegExp(`.{1,${group}}`, 'g')) ?? [code]).join('-');
}

// 入力されたコードを正規化（大文字・英数字以外を除去）
export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
