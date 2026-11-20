export type LegalGoodId = 'rice' | 'apple' | 'spice' | 'silk' | 'medicine';
export type IllegalGoodId = 'forged_documents' | 'stolen_gems' | 'illegal_gun' | 'counterfeit_money';
export type CheckpointGoodId = LegalGoodId | IllegalGoodId;

export type DemandId =
  | 'rice_shortage'
  | 'apple_fair'
  | 'silk_festival'
  | 'medical_drive'
  | 'weapons_crackdown'
  | 'counterfeit_alert'
  | 'honest_trade';

export type ContractId =
  | 'rice_merchant'
  | 'silk_road'
  | 'diverse_cargo'
  | 'arms_dealer'
  | 'master_forger'
  | 'clean_record';

/** Public at game end only: each player's Contract and whether it scored. */
export interface CheckpointContractResult {
  contractId: ContractId;
  /** Display name and emoji, so result screens need no game import. */
  nameTh: string;
  emoji: string;
  completed: boolean;
  value: number;
}

export interface GoodDefinition {
  id: CheckpointGoodId;
  nameTh: string;
  emoji: string;
  legal: boolean;
  value: number;
  penalty: number;
  weight: number;
}

export interface CheckpointDeclaration {
  goodId: LegalGoodId;
  count: number;
}

export interface CheckpointResolution {
  merchantId: string;
  decision: 'pass' | 'inspect';
  truthful: boolean | null;
  goods: CheckpointGoodId[];
  delivered: CheckpointGoodId[];
  confiscated: CheckpointGoodId[];
  cashDelta: Record<string, number>;
  offerPaid: number;
  penaltyPaid: number;
  compensationPaid: number;
  /** Market demand bonus earned by this delivery (optional: older states lack it). */
  marketBonus?: number;
  /** Extra baht from the bank (Honest Trade). */
  bankBonus?: number;
}

export interface CheckpointPublic {
  playerOrder: string[];
  gatekeeperId: string;
  shift: number;
  totalShifts: number;
  cycle: number;
  inspectionSeals: number;
  declarations: Record<string, CheckpointDeclaration>;
  offersSubmitted: string[];
  rumors: Record<string, string>;
  resolvedMerchants: string[];
  resolutions: CheckpointResolution[];
  cash: Record<string, number>;
  delivered: Record<string, Partial<Record<CheckpointGoodId, number>>>;
  /** Running score: cash + delivered value + Market bonus (+ Contracts once complete). */
  wealth: Record<string, number>;
  gameComplete: boolean;
  /** Active Market demand card for this shift. */
  demand: DemandId;
  /** Demand cards already drawn since the last reshuffle (includes `demand`). */
  demandDrawn: DemandId[];
  marketBonus: Record<string, number>;
  confiscatedIllegal: Record<string, number>;
  /** Players who have kept a Contract. Never which one. */
  contractsChosen: string[];
  /** Filled only when the game ends. */
  contractResults?: Record<string, CheckpointContractResult>;
}

export interface CheckpointPrivate {
  hand: CheckpointGoodId[];
  crate: CheckpointGoodId[];
  offer: number | null;
  receivedOffers: Record<string, number>;
  rumorUsed: boolean;
  contractOptions: ContractId[];
  contract: ContractId | null;
}

export interface SubmitCratePayload {
  goods: CheckpointGoodId[];
  declaredGoodId: LegalGoodId;
}


export interface ChooseContractPayload {
  contractId: ContractId;
}
