// TangWong Design System — single import surface.
//
//   import { Button, Stack, Modal, VoteChip, tokens } from '@/design-system';
//
// Components encode the prototype's existing visual language (they reuse the
// .btn/.card/.av/.toast classes) so adopting them changes no pixels.

// ── Tokens ──
export { default as tokens, color, statusColor, space, radius, shadow, duration, easing, zIndex, typography } from './tokens.ts';

// ── Layout ──
export { Page, Container, Stack, Grid, Divider } from './Layout.jsx';

// ── Typography ──
export { Heading, Text, Caption, Label } from './Typography.jsx';

// ── Actions ──
export { Button, IconButton, SegmentedControl } from './Actions.jsx';

// ── Inputs ──
export { Input, TextArea, Select, SearchInput } from './Inputs.jsx';

// ── Feedback ──
export { Badge, Tag, Tooltip, Toast, useToast } from './Feedback.jsx';

// ── Overlay ──
export { Modal, Drawer, BottomSheet } from './Overlay.jsx';

// ── Gaming ──
export { PlayerAvatar, PlayerStatus, VoteChip, RoleBadge, GamePhaseIndicator, TurnIndicator } from './Gaming.jsx';

// ── Cards ──
export { Card, PlayingCard, ResourceCard, GameCard } from './Cards.jsx';
