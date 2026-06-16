import type { ReactElement } from 'react';
import { Badge } from './badge';

type Story = () => ReactElement;

const meta = { title: 'UI/Badge' };
export default meta;

export const Tones: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge tone="primary">Primary</Badge>
    <Badge tone="good">Ready</Badge>
    <Badge tone="evil">Evil</Badge>
    <Badge tone="accent">Host</Badge>
    <Badge tone="neutral">Neutral</Badge>
  </div>
);

export const Variants: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge tone="primary" variant="solid">Solid</Badge>
    <Badge tone="primary" variant="soft">Soft</Badge>
    <Badge tone="primary" variant="outline">Outline</Badge>
  </div>
);

export const CountsAndDots: Story = () => (
  <div className="flex items-center gap-3">
    <Badge count={3} />
    <Badge count={128} max={99} />
    <Badge tone="good" dot aria-label="online" />
    <Badge tone="evil" dot aria-label="eliminated" />
  </div>
);
