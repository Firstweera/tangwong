import type { GameAction, GameState } from '../engine';
import { CHECKPOINT_GOODS, LEGAL_GOODS } from './goods.ts';
import type { CheckpointPrivate, CheckpointPublic, LegalGoodId } from './types.ts';

type State = GameState<CheckpointPublic, CheckpointPrivate>;

const pub = (state: State) => state.public.data;
const priv = (state: State, id: string) => state.private[id]?.data as CheckpointPrivate | undefined;

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function merchants(state: State): string[] {
  return pub(state).playerOrder.filter(id => id !== pub(state).gatekeeperId);
}

export function nextBotAction(state: State, playerId: string): GameAction | null {
  if (state.winner) return null;
  const phase = state.public.phase;
  const data = pub(state);
  const pd = priv(state, playerId);
  if (!pd) return null;
  const isGatekeeper = playerId === data.gatekeeperId;

  if (phase === 'pack' && !isGatekeeper && !data.declarations[playerId]) {
    const count = 1 + (hash(`${playerId}:${data.shift}:count`) % 3);
    const ranked = [...pd.hand].sort((a, b) => {
      const illegalBias = (hash(`${playerId}:${data.shift}:risk`) % 100) < 58;
      if (illegalBias && CHECKPOINT_GOODS[a].legal !== CHECKPOINT_GOODS[b].legal) return CHECKPOINT_GOODS[a].legal ? 1 : -1;
      return CHECKPOINT_GOODS[b].value - CHECKPOINT_GOODS[a].value;
    });
    const goods = ranked.slice(0, Math.min(count, ranked.length));
    const matchingLegal = goods.find(id => CHECKPOINT_GOODS[id].legal) as LegalGoodId | undefined;
    const declaredGoodId = matchingLegal ?? LEGAL_GOODS[hash(`${playerId}:${data.shift}:declare`) % LEGAL_GOODS.length].id;
    return { type: 'SUBMIT_CRATE', playerId, payload: { goods, declaredGoodId } };
  }

  if (phase === 'negotiate' && !isGatekeeper) {
    if (!pd.rumorUsed) {
      const targets = merchants(state).filter(id => id !== playerId);
      if (targets.length > 0) {
        const targetId = targets[hash(`${playerId}:${data.shift}:rumor`) % targets.length];
        return { type: 'PLACE_RUMOR', playerId, payload: { targetId } };
      }
    }
    if (!data.offersSubmitted.includes(playerId)) {
      const illegalCount = pd.crate.filter(id => !CHECKPOINT_GOODS[id].legal).length;
      const amount = Math.min(5, Math.max(0, illegalCount * 2 + (hash(`${playerId}:${data.shift}:offer`) % 2)));
      return { type: 'SUBMIT_OFFER', playerId, payload: { amount } };
    }
  }

  if (phase === 'decide' && isGatekeeper) {
    const unresolved = merchants(state).filter(id => !data.resolvedMerchants.includes(id));
    if (unresolved.length === 0) return null;
    const offers = pd.receivedOffers;
    const suspicion = (id: string) => Object.values(data.rumors).filter(target => target === id).length * 3 - (offers[id] ?? 0);
    const targetId = [...unresolved].sort((a, b) => suspicion(b) - suspicion(a))[0];
    const shouldInspect = data.inspectionSeals > 0 && (suspicion(targetId) > 0 || (offers[targetId] ?? 0) === 0);
    return { type: shouldInspect ? 'INSPECT_MERCHANT' : 'PASS_MERCHANT', playerId, payload: { merchantId: targetId } };
  }

  return null;
}

export function nextAutoActor(state: State, humanId: string, autoAll: boolean): string | null {
  for (const player of state.room.players) {
    if (!autoAll && player.id === humanId) continue;
    if (nextBotAction(state, player.id)) return player.id;
  }
  return null;
}

