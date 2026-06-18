// Avalon rules for the rules sheet — facts (player counts, roles, quest sizes,
// flow, win conditions) are pulled from the real engine so the screen never
// drifts from gameplay.
import { ROLES } from '../../../data.ts';
import type { RoleKey } from '../../../types/index.ts';
import type { GameRules, RuleStep } from '../rules';
import { avalonConfig } from './config';
import { AVALON_PHASES } from './phases';
import { roleSetFor, compositionFor, questsFor } from './setup';

// Per-phase blurbs; the title + which phases exist/order come from the engine.
const STEP_META: Record<string, { emoji: string; desc: string }> = {
  roleReveal:   { emoji: '🎴', desc: 'ทุกคนจับบทบาทลับเป็นฝ่ายดีหรือฝ่ายชั่ว และเห็นข้อมูลตามบทบาทของตน' },
  teamProposal: { emoji: '👑', desc: 'หัวหน้ารอบนั้นเลือกผู้เล่นไปทำภารกิจตามจำนวนที่กำหนด' },
  teamVote:     { emoji: '🗳️', desc: 'ทุกคนโหวตเห็นชอบหรือปฏิเสธทีม ผ่านเมื่อได้เสียงข้างมาก' },
  mission:      { emoji: '⚔️', desc: 'สมาชิกในทีมลงการ์ดลับ สำเร็จหรือทรยศ — ฝ่ายดีลงสำเร็จเท่านั้น' },
  questReveal:  { emoji: '🛡️', desc: 'เปิดผลภารกิจ นับการ์ดทรยศว่าภารกิจสำเร็จหรือล้มเหลว' },
  assassinate:  { emoji: '🗡️', desc: 'หากฝ่ายดีชนะ 3 ภารกิจ ฝ่ายชั่วมีโอกาสสุดท้ายชี้ตัวเมอร์ลิน' },
};

// Distinct roles that can appear across all supported player counts.
const counts = Array.from({ length: avalonConfig.maxPlayers - avalonConfig.minPlayers + 1 }, (_, i) => avalonConfig.minPlayers + i);
const roleKeys = Array.from(new Set(counts.flatMap(n => roleSetFor(n)))) as RoleKey[];

const steps: RuleStep[] = AVALON_PHASES
  .filter(p => STEP_META[p.id])
  .map(p => ({ emoji: STEP_META[p.id].emoji, title: p.labelTh, desc: STEP_META[p.id].desc }));

const q7 = questsFor(7);
const questSizes = q7.map(q => q.size).join('-');

export const avalonRules: GameRules = {
  players: `${avalonConfig.minPlayers}–${avalonConfig.maxPlayers}`,
  goal: 'ฝ่ายดีทำภารกิจสำเร็จ 3 ครั้งโดยไม่ให้เมอร์ลินถูกจับได้ · ฝ่ายชั่วทำลายภารกิจ 3 ครั้ง หรือลอบสังหารเมอร์ลินให้สำเร็จ',
  steps,
  roles: roleKeys.map(k => ({ em: ROLES[k].em, name: ROLES[k].th, side: ROLES[k].side, desc: ROLES[k].desc })),
  composition: counts.map(compositionFor),
  structure: `5 ภารกิจ ชนะ 3 ก่อนเป็นฝ่ายชนะ · ขนาดทีม (7 คน): ${questSizes} · ภารกิจ 4 ต้องการ 2 การ์ดทรยศเมื่อมีผู้เล่น 7 คนขึ้นไป`,
  win: [
    '🛡️ ฝ่ายดีชนะ: ทำภารกิจสำเร็จ 3 ครั้ง และเมอร์ลินรอดจากการลอบสังหาร',
    '🗡️ ฝ่ายชั่วชนะ: ทำลายภารกิจ 3 ครั้ง',
    '🗡️ ฝ่ายชั่วชนะ: ทีมถูกปฏิเสธ 5 ครั้งติดต่อกัน หรือ ลอบสังหารเมอร์ลินสำเร็จ',
  ],
  tips: [
    'อย่าเปิดเผยว่าเป็นเมอร์ลินเร็วเกินไป มิฉะนั้นจะถูกลอบสังหาร',
    'สังเกตว่าใครโหวตผ่านทีมที่มีคนน่าสงสัย',
    'เพอร์ซิวาลเห็นทั้งเมอร์ลินและมอร์กานา แต่แยกไม่ออกว่าใครจริง',
  ],
};
