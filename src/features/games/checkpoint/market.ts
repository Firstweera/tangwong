// Market demand cards and private Contracts (rules: docs/games/checkpoint-rules.md).
// Pure data + scoring helpers. Randomness lives only in the draw helpers, which
// setup and CONTINUE_SHIFT call, same as drawGoods.
import { CHECKPOINT_GOODS } from './goods.ts';
import type {
  CheckpointGoodId,
  CheckpointPublic,
  ContractId,
  DemandId,
} from './types.ts';

export interface DemandDefinition {
  id: DemandId;
  nameTh: string;
  emoji: string;
  descTh: string;
  /** Market bonus per delivered card of this good. */
  perGood?: Partial<Record<CheckpointGoodId, number>>;
  /** Market bonus once per crate that delivers at least one of this good. */
  oncePerCrate?: { goodId: CheckpointGoodId; bonus: number };
  /** Extra inspection penalty per confiscated card of this good. */
  penaltyExtra?: Partial<Record<CheckpointGoodId, number>>;
  /** Baht from the bank to a truthful inspected merchant. */
  honestBonus?: number;
}

export const CHECKPOINT_DEMANDS: Record<DemandId, DemandDefinition> = {
  rice_shortage: { id: 'rice_shortage', nameTh: 'ข้าวขาดตลาด', emoji: '🍚', descTh: 'ข้าวที่ส่งผ่านด่าน +1 ต่อชิ้น', perGood: { rice: 1 } },
  apple_fair: { id: 'apple_fair', nameTh: 'เทศกาลแอปเปิล', emoji: '🍎', descTh: 'ส่งแอปเปิลผ่านด่านได้ +1 (ครั้งเดียวต่อกะ)', oncePerCrate: { goodId: 'apple', bonus: 1 } },
  silk_festival: { id: 'silk_festival', nameTh: 'งานผ้าไหม', emoji: '🧵', descTh: 'ผ้าไหมที่ส่งผ่านด่าน +2 ต่อชิ้น', perGood: { silk: 2 } },
  medical_drive: { id: 'medical_drive', nameTh: 'รณรงค์ยา', emoji: '💊', descTh: 'ยาที่ส่งผ่านด่าน +2 ต่อชิ้น', perGood: { medicine: 2 } },
  weapons_crackdown: { id: 'weapons_crackdown', nameTh: 'กวาดล้างปืนเถื่อน', emoji: '🚨', descTh: 'ปืนเถื่อนที่ถูกยึด ปรับเพิ่ม 2 บาทต่อชิ้น', penaltyExtra: { illegal_gun: 2 } },
  counterfeit_alert: { id: 'counterfeit_alert', nameTh: 'เตือนภัยแบงก์ปลอม', emoji: '⚠️', descTh: 'ธนบัตรปลอมที่ถูกยึด ปรับเพิ่ม 2 บาทต่อชิ้น', penaltyExtra: { counterfeit_money: 2 } },
  honest_trade: { id: 'honest_trade', nameTh: 'ค้าขายสุจริต', emoji: '🤝', descTh: 'ถูกตรวจแล้วซื่อสัตย์ รับเพิ่ม 1 บาทจากธนาคาร', honestBonus: 1 },
};

export const DEMAND_IDS = Object.keys(CHECKPOINT_DEMANDS) as DemandId[];

/** Draw the next demand from the cards not yet drawn; reshuffle when all are used. */
export function drawDemand(drawn: DemandId[]): { demand: DemandId; drawn: DemandId[] } {
  const remaining = DEMAND_IDS.filter(id => !drawn.includes(id));
  const pool = remaining.length > 0 ? remaining : DEMAND_IDS;
  const demand = pool[Math.floor(Math.random() * pool.length)];
  return { demand, drawn: remaining.length > 0 ? [...drawn, demand] : [demand] };
}

export function demandBonusFor(demandId: DemandId | undefined, delivered: CheckpointGoodId[]): number {
  const demand = demandId ? CHECKPOINT_DEMANDS[demandId] : undefined;
  if (!demand) return 0;
  let bonus = delivered.reduce((sum, id) => sum + (demand.perGood?.[id] ?? 0), 0);
  if (demand.oncePerCrate && delivered.includes(demand.oncePerCrate.goodId)) bonus += demand.oncePerCrate.bonus;
  return bonus;
}

export function demandPenaltyExtra(demandId: DemandId | undefined, goodId: CheckpointGoodId): number {
  return demandId ? CHECKPOINT_DEMANDS[demandId]?.penaltyExtra?.[goodId] ?? 0 : 0;
}

export interface ContractDefinition {
  id: ContractId;
  nameTh: string;
  emoji: string;
  descTh: string;
  value: number;
  /** Progress toward the goal, `current` capped at `target`. */
  progress(delivered: Partial<Record<CheckpointGoodId, number>>, confiscatedIllegal: number): { current: number; target: number; done: boolean };
}

function deliverCount(goodId: CheckpointGoodId, target: number) {
  return (delivered: Partial<Record<CheckpointGoodId, number>>) => {
    const current = Math.min(target, delivered[goodId] ?? 0);
    return { current, target, done: current >= target };
  };
}

export const CHECKPOINT_CONTRACTS: Record<ContractId, ContractDefinition> = {
  rice_merchant: { id: 'rice_merchant', nameTh: 'พ่อค้าข้าว', emoji: '🍚', descTh: 'ส่งข้าวผ่านด่านครบ 4 ชิ้น', value: 5, progress: deliverCount('rice', 4) },
  silk_road: { id: 'silk_road', nameTh: 'เส้นทางไหม', emoji: '🧵', descTh: 'ส่งผ้าไหมผ่านด่านครบ 3 ชิ้น', value: 5, progress: deliverCount('silk', 3) },
  diverse_cargo: {
    id: 'diverse_cargo', nameTh: 'สินค้าหลากหลาย', emoji: '🧺', descTh: 'ส่งสินค้าผ่านด่านอย่างน้อย 4 ชนิด', value: 4,
    progress(delivered) {
      const kinds = Object.values(delivered).filter(count => (count ?? 0) > 0).length;
      const current = Math.min(4, kinds);
      return { current, target: 4, done: current >= 4 };
    },
  },
  arms_dealer: { id: 'arms_dealer', nameTh: 'นายหน้าอาวุธ', emoji: '🔫', descTh: 'ส่งปืนเถื่อนผ่านด่านครบ 2 ชิ้น', value: 7, progress: deliverCount('illegal_gun', 2) },
  master_forger: { id: 'master_forger', nameTh: 'ช่างปลอมแปลง', emoji: '💵', descTh: 'ส่งธนบัตรปลอมผ่านด่านครบ 2 ชิ้น', value: 7, progress: deliverCount('counterfeit_money', 2) },
  clean_record: {
    id: 'clean_record', nameTh: 'ประวัติขาวสะอาด', emoji: '🕊️', descTh: 'ไม่โดนยึดของผิดกฎหมายเลยตลอดเกม', value: 4,
    progress(_delivered, confiscatedIllegal) {
      const done = confiscatedIllegal === 0;
      return { current: done ? 1 : 0, target: 1, done };
    },
  },
};

export const CONTRACT_IDS = Object.keys(CHECKPOINT_CONTRACTS) as ContractId[];

/** Two different Contracts at random (setup only). */
export function dealContractOptions(): ContractId[] {
  const first = CONTRACT_IDS[Math.floor(Math.random() * CONTRACT_IDS.length)];
  const rest = CONTRACT_IDS.filter(id => id !== first);
  return [first, rest[Math.floor(Math.random() * rest.length)]];
}

export function contractProgress(pub: CheckpointPublic, playerId: string, contractId: ContractId) {
  return CHECKPOINT_CONTRACTS[contractId].progress(pub.delivered?.[playerId] ?? {}, pub.confiscatedIllegal?.[playerId] ?? 0);
}

export function deliveredLegalCount(delivered: Partial<Record<CheckpointGoodId, number>>): number {
  return Object.entries(delivered).reduce(
    (sum, [id, count]) => sum + (CHECKPOINT_GOODS[id as CheckpointGoodId]?.legal ? count ?? 0 : 0),
    0,
  );
}
