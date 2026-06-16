import type { ReactElement } from 'react';
import { Tooltip } from './tooltip';
import { Button } from '../button';

type Story = () => ReactElement;

const meta = { title: 'UI/Tooltip' };
export default meta;

export const Placements: Story = () => (
  <div className="flex gap-6 p-10">
    {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
      <Tooltip.Root key={p} placement={p}>
        <Tooltip.Trigger>
          <Button variant="glass" size="sm">{p}</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Reveals on {p}</Tooltip.Content>
      </Tooltip.Root>
    ))}
  </div>
);
