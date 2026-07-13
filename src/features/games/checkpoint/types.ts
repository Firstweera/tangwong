export type LegalGoodId = 'rice' | 'apple' | 'spice' | 'silk' | 'medicine';
export type IllegalGoodId = 'forged_documents' | 'stolen_gems' | 'illegal_gun' | 'counterfeit_money';
export type CheckpointGoodId = LegalGoodId | IllegalGoodId;

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
  wealth: Record<string, number>;
  gameComplete: boolean;
}

export interface CheckpointPrivate {
  hand: CheckpointGoodId[];
  crate: CheckpointGoodId[];
  offer: number | null;
  receivedOffers: Record<string, number>;
  rumorUsed: boolean;
}

export interface SubmitCratePayload {
  goods: CheckpointGoodId[];
  declaredGoodId: LegalGoodId;
}

