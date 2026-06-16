import type { ReactElement } from 'react';
import { Avatar } from './avatar';

type Story = () => ReactElement;

const meta = { title: 'UI/Avatar' };
export default meta;

export const Variants: Story = () => (
  <div className="flex items-center gap-4">
    <Avatar mascot="fox" name="Fox" />
    <Avatar mascot="owl" name="Owl" status="online" />
    <Avatar mascot="cat" name="Cat" ring badge="👑" />
    <Avatar name="Jane Doe" />
    <Avatar mascot="raccoon" name="Out" faded status="offline" />
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-3">
    <Avatar mascot="fox" size={28} />
    <Avatar mascot="fox" size={44} />
    <Avatar mascot="fox" size={64} />
  </div>
);

export const Group: Story = () => (
  <Avatar.Group max={3}>
    <Avatar mascot="fox" />
    <Avatar mascot="owl" />
    <Avatar mascot="cat" />
    <Avatar mascot="raccoon" />
    <Avatar mascot="fox" />
  </Avatar.Group>
);
