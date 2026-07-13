import type { GamePlayer } from '../engine';
import type { CheckpointPrivate, CheckpointPublic } from './types.ts';
import { drawGoods } from './goods.ts';

export function inspectionSealsFor(playerCount: number): number {
  return playerCount <= 3 ? 1 : 2;
}

export function buildCheckpointPublic(players: GamePlayer[]): CheckpointPublic {
  const order = players.map(player => player.id);
  const emptyInventory = Object.fromEntries(order.map(id => [id, {}]));
  return {
    playerOrder: order,
    gatekeeperId: order[0],
    shift: 1,
    totalShifts: players.length * 2,
    cycle: 1,
    inspectionSeals: inspectionSealsFor(players.length),
    declarations: {},
    offersSubmitted: [],
    rumors: {},
    resolvedMerchants: [],
    resolutions: [],
    cash: Object.fromEntries(order.map(id => [id, 20])),
    delivered: emptyInventory,
    wealth: Object.fromEntries(order.map(id => [id, 20])),
    gameComplete: false,
  };
}

export function buildCheckpointPrivate(players: GamePlayer[]): Record<string, CheckpointPrivate> {
  return Object.fromEntries(players.map(player => [player.id, {
    hand: drawGoods(6),
    crate: [],
    offer: null,
    receivedOffers: {},
    rumorUsed: false,
  }]));
}

