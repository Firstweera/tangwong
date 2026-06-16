// Type declarations for the legacy (untyped .jsx) UI barrel, so strict TS
// consumers get optional props instead of inferred all-required props.
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { Player, Game } from '@/types';

export const ICONS: Record<string, string>;

export function Icon(props: {
  name: string; size?: number; stroke?: number; fill?: string; style?: CSSProperties;
}): ReactElement;

export function Avatar(props: {
  who?: Player; size?: number; ring?: string | boolean; dot?: boolean;
  crown?: boolean; faded?: boolean; style?: CSSProperties; onClick?: () => void;
}): ReactElement;

export function AvatarStack(props: { people: Player[]; size?: number; max?: number }): ReactElement;

export function Logo(props: { size?: number; showWord?: boolean }): ReactElement;

export function GameCard(props: { game: Game; onClick?: () => void; height?: number; big?: boolean }): ReactElement;

export function QuestTrack(props: { results: Array<string | null>; current: number }): ReactElement;

export function Confetti(props?: { count?: number; colors?: string[] }): ReactElement;

export function useToast(): [ReactNode, (message: string, icon?: string) => void];

export function CardBack(props: { w?: number; h?: number; style?: CSSProperties }): ReactElement;
export function CardFan(props: { count?: number; w?: number; h?: number; spread?: number; rise?: number }): ReactElement;
export function Token(props: { kind?: 'good' | 'evil' | 'gold'; size?: number; children?: ReactNode; style?: CSSProperties }): ReactElement;
export function Die(props: { face?: number; size?: number; style?: CSSProperties }): ReactElement;
