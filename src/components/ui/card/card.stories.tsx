import type { ReactElement } from 'react';
import { Card } from './card';
import { Heading, Text } from '../typography';
import { Button } from '../button';

type Story = () => ReactElement;

const meta = { title: 'UI/Card' };
export default meta;

export const Variants: Story = () => (
  <div className="flex flex-col gap-3" style={{ maxWidth: 320 }}>
    {(['glass', 'solid', 'outline'] as const).map((v) => (
      <Card key={v} variant={v}>
        <Card.Header>
          <Heading level={3}>{v} card</Heading>
        </Card.Header>
        <Card.Body>
          <Text tone="muted">A composable surface with header, body and footer.</Text>
        </Card.Body>
        <Card.Footer>
          <Button size="sm" variant="ghost">Action</Button>
        </Card.Footer>
      </Card>
    ))}
  </div>
);

export const Interactive: Story = () => (
  <Card interactive onClick={() => alert('joined')} style={{ maxWidth: 320 }}>
    <Card.Body>
      <Heading level={3}>Tap to join room</Heading>
      <Text tone="muted">Whole card is keyboard + click accessible.</Text>
    </Card.Body>
  </Card>
);
