import type { ReactElement } from 'react';
import { Button, IconButton, ButtonGroup } from './button';

type Story = () => ReactElement;

const meta = { title: 'UI/Button' };
export default meta;

const Plus = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;

export const Variants: Story = () => (
  <div className="flex flex-wrap gap-3">
    <Button variant="primary">Primary</Button>
    <Button variant="accent">Accent</Button>
    <Button variant="glass">Glass</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="good">Approve</Button>
    <Button variant="evil">Reject</Button>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const States: Story = () => (
  <div className="flex flex-wrap gap-3">
    <Button leftIcon={Plus}>With icon</Button>
    <Button loading>Loading</Button>
    <Button disabled>Disabled</Button>
    <Button block>Full width</Button>
  </div>
);

export const Icons: Story = () => (
  <ButtonGroup aria-label="room actions">
    <IconButton aria-label="add player" icon={Plus} variant="grad" />
    <IconButton aria-label="settings" icon={Plus} variant="surface" />
    <IconButton aria-label="close" icon={Plus} variant="ghost" />
  </ButtonGroup>
);
