import type { ReactElement } from 'react';
import { Sheet } from './sheet';
import { Button } from '../button';
import { Text } from '../typography';

type Story = () => ReactElement;

const meta = { title: 'UI/Sheet' };
export default meta;

export const BottomSheet: Story = () => (
  <Sheet.Root>
    <Sheet.Trigger>
      <Button>Open game settings</Button>
    </Sheet.Trigger>
    <Sheet.Content side="bottom">
      <Sheet.Header>
        <Sheet.Title>Game settings</Sheet.Title>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Description>Adjust the room before starting.</Sheet.Description>
      <Sheet.Footer>
        <Button block>Save</Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
);

export const SideDrawer: Story = () => (
  <Sheet.Root>
    <Sheet.Trigger>
      <Button variant="glass">Open players</Button>
    </Sheet.Trigger>
    <Sheet.Content side="right">
      <Sheet.Header>
        <Sheet.Title>Players</Sheet.Title>
        <Sheet.Close />
      </Sheet.Header>
      <Text tone="muted">A right-side drawer reusing the same dialog a11y.</Text>
    </Sheet.Content>
  </Sheet.Root>
);
