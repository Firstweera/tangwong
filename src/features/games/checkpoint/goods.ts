import type { CheckpointGoodId, GoodDefinition, LegalGoodId } from './types.ts';

export const CHECKPOINT_GOODS: Record<CheckpointGoodId, GoodDefinition> = {
  rice: { id: 'rice', nameTh: 'ข้าว', emoji: '🍚', legal: true, value: 2, penalty: 1, weight: 8 },
  apple: { id: 'apple', nameTh: 'แอปเปิล', emoji: '🍎', legal: true, value: 2, penalty: 1, weight: 8 },
  spice: { id: 'spice', nameTh: 'เครื่องเทศ', emoji: '🫙', legal: true, value: 3, penalty: 1, weight: 8 },
  silk: { id: 'silk', nameTh: 'ผ้าไหม', emoji: '🧵', legal: true, value: 3, penalty: 1, weight: 8 },
  medicine: { id: 'medicine', nameTh: 'ยารักษาโรค', emoji: '💊', legal: true, value: 4, penalty: 2, weight: 8 },
  forged_documents: { id: 'forged_documents', nameTh: 'เอกสารปลอม', emoji: '📜', legal: false, value: 6, penalty: 3, weight: 4 },
  stolen_gems: { id: 'stolen_gems', nameTh: 'อัญมณีโจรกรรม', emoji: '💎', legal: false, value: 7, penalty: 3, weight: 4 },
  illegal_gun: { id: 'illegal_gun', nameTh: 'ปืนเถื่อน', emoji: '🔫', legal: false, value: 8, penalty: 4, weight: 4 },
  counterfeit_money: { id: 'counterfeit_money', nameTh: 'ธนบัตรปลอม', emoji: '💵', legal: false, value: 9, penalty: 5, weight: 4 },
};

export const LEGAL_GOODS = Object.values(CHECKPOINT_GOODS).filter(
  (good): good is GoodDefinition & { id: LegalGoodId } => good.legal,
);

const DRAW_POOL = Object.values(CHECKPOINT_GOODS).flatMap(good => Array(good.weight).fill(good.id));

export function drawGoods(count: number): CheckpointGoodId[] {
  return Array.from({ length: Math.max(0, count) }, () => DRAW_POOL[Math.floor(Math.random() * DRAW_POOL.length)]);
}

export function goodsValue(goods: Partial<Record<CheckpointGoodId, number>>): number {
  return Object.entries(goods).reduce(
    (sum, [id, count]) => sum + CHECKPOINT_GOODS[id as CheckpointGoodId].value * (count ?? 0),
    0,
  );
}

