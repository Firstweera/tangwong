// Type declarations for the legacy (untyped .jsx) layout barrel.
import type { CSSProperties, ReactElement, ReactNode } from 'react';

export function Screen(props: { children?: ReactNode; style?: CSSProperties; scrollStyle?: CSSProperties }): ReactElement;
export function ScrollScreen(props: { children?: ReactNode; bottomPad?: number; style?: CSSProperties }): ReactElement;

export function Header(props: { left?: ReactNode; title?: ReactNode; subtitle?: ReactNode; right?: ReactNode }): ReactElement;
export function IconButton(props: { children?: ReactNode; onClick?: () => void; style?: CSSProperties }): ReactElement;

export function BottomBar(props: { children?: ReactNode; paddingBottom?: number }): ReactElement;
