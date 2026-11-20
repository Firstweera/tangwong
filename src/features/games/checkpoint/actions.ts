import type { ActionDef, GameState } from '../engine';
import { CHECKPOINT_GOODS, drawGoods, goodsValue } from './goods.ts';
import { inspectionSealsFor } from './setup.ts';
import {
  CHECKPOINT_CONTRACTS,
  CHECKPOINT_DEMANDS,
  contractProgress,
  demandBonusFor,
  demandPenaltyExtra,
  drawDemand,
} from './market.ts';
import type {
  CheckpointContractResult,
  CheckpointGoodId,
  CheckpointPrivate,
  CheckpointPublic,
  CheckpointResolution,
  ChooseContractPayload,
  SubmitCratePayload,
} from './types.ts';

type State = GameState<CheckpointPublic, CheckpointPrivate>;

const P = (state: State) => state.public.data;
const priv = (state: State, id: string) => state.private[id]?.data as CheckpointPrivate | undefined;
const merchants = (state: State) => P(state).playerOrder.filter(id => id !== P(state).gatekeeperId);

function patchPublic(state: State, data: Partial<CheckpointPublic>): State {
  return { ...state, public: { ...state.public, data: { ...P(state), ...data } } };
}

function patchPrivate(state: State, id: string, data: Partial<CheckpointPrivate>): State {
  const previous = state.private[id];
  return {
    ...state,
    private: {
      ...state.private,
      [id]: { ...previous, data: { ...(previous?.data as CheckpointPrivate), ...data } },
    },
  };
}

function isPlayer(state: State, id: string): boolean {
  return P(state).playerOrder.includes(id);
}

function hasGoods(hand: CheckpointGoodId[], requested: CheckpointGoodId[]): boolean {
  const counts = new Map<CheckpointGoodId, number>();
  hand.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1));
  for (const id of requested) {
    const remaining = counts.get(id) ?? 0;
    if (remaining <= 0) return false;
    counts.set(id, remaining - 1);
  }
  return true;
}

function removeGoods(hand: CheckpointGoodId[], requested: CheckpointGoodId[]): CheckpointGoodId[] {
  const next = [...hand];
  for (const id of requested) next.splice(next.indexOf(id), 1);
  return next;
}

function addInventory(
  inventory: CheckpointPublic['delivered'],
  playerId: string,
  goods: CheckpointGoodId[],
): CheckpointPublic['delivered'] {
  const playerInventory = { ...(inventory[playerId] ?? {}) };
  for (const id of goods) playerInventory[id] = (playerInventory[id] ?? 0) + 1;
  return { ...inventory, [playerId]: playerInventory };
}

function transferCash(cash: Record<string, number>, from: string, to: string, requested: number): {
  cash: Record<string, number>;
  paid: number;
} {
  const paid = Math.max(0, Math.min(requested, cash[from] ?? 0));
  return { cash: { ...cash, [from]: (cash[from] ?? 0) - paid, [to]: (cash[to] ?? 0) + paid }, paid };
}

/** Running score: cash + delivered value + Market bonus. Contracts are added at game end. */
function wealthOf(pub: Pick<CheckpointPublic, 'playerOrder' | 'cash' | 'delivered' | 'marketBonus'>): Record<string, number> {
  return Object.fromEntries(pub.playerOrder.map(id => [
    id,
    (pub.cash[id] ?? 0) + goodsValue(pub.delivered[id] ?? {}) + (pub.marketBonus?.[id] ?? 0),
  ]));
}

const chooseContract: ActionDef<CheckpointPublic, CheckpointPrivate> = {
  validate(state, action) {
    if (!isPlayer(state, action.playerId)) return { valid: false, error: 'Not a player' };
    if ((P(state).contractsChosen ?? []).includes(action.playerId)) return { valid: false, error: 'Contract already chosen' };
    const contractId = (action.payload as Partial<ChooseContractPayload> | null)?.contractId;
    if (!contractId || !(priv(state, action.playerId)?.contractOptions ?? []).includes(contractId)) {
      return { valid: false, error: 'Contract is not one of your options' };
    }
    return { valid: true };
  },
  handle(state, action) {
    const { contractId } = action.payload as ChooseContractPayload;
    const next = patchPrivate(state, action.playerId, { contract: contractId });
    return patchPublic(next, { contractsChosen: [...(P(next).contractsChosen ?? []), action.playerId] });
  },
};

const submitCrate: ActionDef<CheckpointPublic, CheckpointPrivate> = {
  validate(state, action) {
    if (!isPlayer(state, action.playerId) || action.playerId === P(state).gatekeeperId) return { valid: false, error: 'Gatekeeper cannot pack cargo' };
    if (P(state).declarations[action.playerId]) return { valid: false, error: 'Crate already submitted' };
    const payload = action.payload as Partial<SubmitCratePayload> | null;
    if (!payload?.declaredGoodId || !CHECKPOINT_GOODS[payload.declaredGoodId]?.legal) return { valid: false, error: 'Declare one legal good' };
    if (!Array.isArray(payload.goods) || payload.goods.length < 1 || payload.goods.length > 3) return { valid: false, error: 'Pack 1 to 3 goods' };
    if (payload.goods.some(id => !CHECKPOINT_GOODS[id])) return { valid: false, error: 'Invalid good' };
    if (!hasGoods(priv(state, action.playerId)?.hand ?? [], payload.goods)) return { valid: false, error: 'Goods are not in your hand' };
    return { valid: true };
  },
  handle(state, action) {
    const payload = action.payload as SubmitCratePayload;
    const pd = priv(state, action.playerId)!;
    let next = patchPrivate(state, action.playerId, {
      hand: removeGoods(pd.hand, payload.goods),
      crate: [...payload.goods],
    });
    next = patchPublic(next, {
      declarations: {
        ...P(next).declarations,
        [action.playerId]: { goodId: payload.declaredGoodId, count: payload.goods.length },
      },
    });
    return next;
  },
};

const placeRumor: ActionDef<CheckpointPublic, CheckpointPrivate> = {
  validate(state, action) {
    if (action.playerId === P(state).gatekeeperId) return { valid: false, error: 'Gatekeeper cannot place a rumor' };
    if (priv(state, action.playerId)?.rumorUsed) return { valid: false, error: 'Rumor already used this shift' };
    const targetId = (action.payload as { targetId?: string })?.targetId;
    if (!targetId || targetId === action.playerId || !merchants(state).includes(targetId)) return { valid: false, error: 'Invalid rumor target' };
    return { valid: true };
  },
  handle(state, action) {
    const targetId = (action.payload as { targetId: string }).targetId;
    let next = patchPrivate(state, action.playerId, { rumorUsed: true });
    next = patchPublic(next, { rumors: { ...P(next).rumors, [action.playerId]: targetId } });
    return next;
  },
};

const submitOffer: ActionDef<CheckpointPublic, CheckpointPrivate> = {
  validate(state, action) {
    if (action.playerId === P(state).gatekeeperId || !P(state).declarations[action.playerId]) return { valid: false, error: 'Only a packed merchant can offer' };
    if (P(state).offersSubmitted.includes(action.playerId)) return { valid: false, error: 'Offer already sealed' };
    const amount = Number((action.payload as { amount?: number })?.amount);
    if (!Number.isInteger(amount) || amount < 0 || amount > 5) return { valid: false, error: 'Offer must be 0 to 5 baht' };
    if (amount > (P(state).cash[action.playerId] ?? 0)) return { valid: false, error: 'Not enough cash' };
    return { valid: true };
  },
  handle(state, action) {
    const amount = Number((action.payload as { amount: number }).amount);
    const gatekeeperId = P(state).gatekeeperId;
    let next = patchPrivate(state, action.playerId, { offer: amount });
    next = patchPrivate(next, gatekeeperId, {
      receivedOffers: { ...(priv(next, gatekeeperId)?.receivedOffers ?? {}), [action.playerId]: amount },
    });
    return patchPublic(next, { offersSubmitted: [...P(next).offersSubmitted, action.playerId] });
  },
};

function resolveMerchant(state: State, merchantId: string, decision: 'pass' | 'inspect'): State {
  const pub = P(state);
  const gatekeeperId = pub.gatekeeperId;
  const crate = [...(priv(state, merchantId)?.crate ?? [])];
  const declaration = pub.declarations[merchantId];
  const offer = priv(state, merchantId)?.offer ?? 0;
  const truthful = decision === 'inspect' ? crate.every(id => id === declaration.goodId) : null;
  let delivered = crate;
  let confiscated: CheckpointGoodId[] = [];
  let cash = { ...pub.cash };
  let offerPaid = 0;
  let penaltyPaid = 0;
  let compensationPaid = 0;
  let bankBonus = 0;

  if (decision === 'pass') {
    const transfer = transferCash(cash, merchantId, gatekeeperId, offer);
    cash = transfer.cash;
    offerPaid = transfer.paid;
  } else if (truthful) {
    const transfer = transferCash(cash, gatekeeperId, merchantId, crate.length);
    cash = transfer.cash;
    compensationPaid = transfer.paid;
    bankBonus = CHECKPOINT_DEMANDS[pub.demand]?.honestBonus ?? 0;
    cash[merchantId] = (cash[merchantId] ?? 0) + bankBonus;
  } else {
    delivered = crate.filter(id => id === declaration.goodId);
    confiscated = crate.filter(id => id !== declaration.goodId);
    const penalty = confiscated.reduce((sum, id) => sum + CHECKPOINT_GOODS[id].penalty + demandPenaltyExtra(pub.demand, id), 0);
    const transfer = transferCash(cash, merchantId, gatekeeperId, penalty);
    cash = transfer.cash;
    penaltyPaid = transfer.paid;
  }

  if (decision === 'inspect') {
    for (const [accuserId, targetId] of Object.entries(pub.rumors)) {
      if (targetId !== merchantId) continue;
      if (truthful) cash[accuserId] = Math.max(0, (cash[accuserId] ?? 0) - 1);
      else cash[accuserId] = (cash[accuserId] ?? 0) + 2;
    }
  }

  const ids = pub.playerOrder;
  const cashDelta = Object.fromEntries(ids.map(id => [id, (cash[id] ?? 0) - (pub.cash[id] ?? 0)]));
  const marketBonusEarned = demandBonusFor(pub.demand, delivered);
  const resolution: CheckpointResolution = {
    merchantId, decision, truthful, goods: crate, delivered, confiscated, cashDelta,
    offerPaid, penaltyPaid, compensationPaid, marketBonus: marketBonusEarned, bankBonus,
  };
  const nextDelivered = addInventory(pub.delivered, merchantId, delivered);
  const marketBonus = { ...(pub.marketBonus ?? {}), [merchantId]: (pub.marketBonus?.[merchantId] ?? 0) + marketBonusEarned };
  const illegalLost = confiscated.filter(id => !CHECKPOINT_GOODS[id].legal).length;
  const confiscatedIllegal = { ...(pub.confiscatedIllegal ?? {}), [merchantId]: (pub.confiscatedIllegal?.[merchantId] ?? 0) + illegalLost };
  return patchPublic(state, {
    inspectionSeals: decision === 'inspect' ? pub.inspectionSeals - 1 : pub.inspectionSeals,
    resolvedMerchants: [...pub.resolvedMerchants, merchantId],
    resolutions: [...pub.resolutions, resolution],
    cash,
    delivered: nextDelivered,
    marketBonus,
    confiscatedIllegal,
    wealth: wealthOf({ playerOrder: ids, cash, delivered: nextDelivered, marketBonus }),
  });
}

function decisionAction(decision: 'pass' | 'inspect'): ActionDef<CheckpointPublic, CheckpointPrivate> {
  return {
    validate(state, action) {
      if (action.playerId !== P(state).gatekeeperId) return { valid: false, error: 'Only the gatekeeper can decide' };
      const merchantId = (action.payload as { merchantId?: string })?.merchantId;
      if (!merchantId || !merchants(state).includes(merchantId)) return { valid: false, error: 'Invalid merchant' };
      if (P(state).resolvedMerchants.includes(merchantId)) return { valid: false, error: 'Merchant already resolved' };
      if (decision === 'inspect' && P(state).inspectionSeals <= 0) return { valid: false, error: 'No inspection seals left' };
      return { valid: true };
    },
    handle(state, action) {
      return resolveMerchant(state, (action.payload as { merchantId: string }).merchantId, decision);
    },
  };
}

const continueShift: ActionDef<CheckpointPublic, CheckpointPrivate> = {
  validate(state, action) {
    if (action.playerId !== state.room.hostId) return { valid: false, error: 'Only the host can continue' };
    if (P(state).resolvedMerchants.length !== merchants(state).length) return { valid: false, error: 'Shift is not resolved' };
    return { valid: true };
  },
  handle(state) {
    const pub = P(state);
    if (pub.shift >= pub.totalShifts) {
      // Game end: reveal every Contract and add completed ones to the score.
      const base = wealthOf(pub);
      const contractResults: Record<string, CheckpointContractResult> = {};
      for (const id of pub.playerOrder) {
        const contractId = priv(state, id)?.contract;
        if (!contractId || !CHECKPOINT_CONTRACTS[contractId]) continue;
        const completed = contractProgress(pub, id, contractId).done;
        const def = CHECKPOINT_CONTRACTS[contractId];
        contractResults[id] = { contractId, nameTh: def.nameTh, emoji: def.emoji, completed, value: completed ? def.value : 0 };
      }
      const wealth = Object.fromEntries(pub.playerOrder.map(id => [id, base[id] + (contractResults[id]?.value ?? 0)]));
      return patchPublic(state, { gameComplete: true, wealth, contractResults });
    }

    const nextShift = pub.shift + 1;
    const nextDemand = drawDemand(pub.demandDrawn ?? []);
    const nextGatekeeperId = pub.playerOrder[(nextShift - 1) % pub.playerOrder.length];
    let next = state;
    for (const id of pub.playerOrder) {
      const pd = priv(next, id)!;
      next = patchPrivate(next, id, {
        hand: [...pd.hand, ...drawGoods(6 - pd.hand.length)],
        crate: [],
        offer: null,
        receivedOffers: {},
        rumorUsed: false,
      });
    }
    next = patchPublic(next, {
      gatekeeperId: nextGatekeeperId,
      shift: nextShift,
      cycle: Math.floor((nextShift - 1) / pub.playerOrder.length) + 1,
      inspectionSeals: inspectionSealsFor(pub.playerOrder.length),
      declarations: {}, offersSubmitted: [], rumors: {}, resolvedMerchants: [], resolutions: [],
      demand: nextDemand.demand,
      demandDrawn: nextDemand.drawn,
    });
    return {
      ...next,
      public: { ...next.public, turn: nextShift, round: P(next).cycle, activePlayerId: nextGatekeeperId },
    };
  },
};

export const CHECKPOINT_ACTIONS: Record<string, ActionDef<CheckpointPublic, CheckpointPrivate>> = {
  CHOOSE_CONTRACT: chooseContract,
  SUBMIT_CRATE: submitCrate,
  PLACE_RUMOR: placeRumor,
  SUBMIT_OFFER: submitOffer,
  PASS_MERCHANT: decisionAction('pass'),
  INSPECT_MERCHANT: decisionAction('inspect'),
  CONTINUE_SHIFT: continueShift,
};
