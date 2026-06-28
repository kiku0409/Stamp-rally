'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface NicknameFormProps {
  onSubmit: (gender: string, ageGroup: string) => void;
  loading?: boolean;
}

const GENDERS = ['男性', '女性', 'その他'];
const AGE_GROUPS = ['10代', '20代', '30代', '40代', '50代以上'];

export default function NicknameForm({ onSubmit, loading }: NicknameFormProps) {
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');

  const selectClass =
    'w-full px-4 py-3.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[15px] font-medium bg-white text-ink appearance-none';

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="header-grad rounded-t-2xl px-5 pt-5 pb-0">
        <p
          className="text-[11px] tracking-widest text-white/70 mb-3 text-center"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          LIVE STAMP · <span className="text-white font-bold">Ticket</span>
        </p>
        <div className="relative pb-5">
          <div className="w-14 h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mx-auto">
            <User size={24} strokeWidth={2} className="text-white" />
          </div>
        </div>
        <div className="relative">
          <div className="border-t-2 border-dashed border-white/30" />
          <div className="absolute -left-5 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
          <div className="absolute -right-5 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
        </div>
      </div>

      <div className="bg-white rounded-b-2xl px-5 pb-5 pt-5 card-shadow">
        <div className="text-center mb-6">
          <h2 className="text-[20px] font-bold text-ink mb-1.5">基本情報を入力</h2>
          <p className="text-muted text-[13px]">性別と年代を選択してください</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (gender && ageGroup) onSubmit(gender, ageGroup);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-muted mb-1.5 font-medium">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">選択</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-muted mb-1.5 font-medium">年代</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">選択</option>
                {AGE_GROUPS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!gender || !ageGroup || loading}
            className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
