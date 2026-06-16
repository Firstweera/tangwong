// Storybook-style examples (CSF-compatible). Each named export is a "story".
// Renders inside .app so the design tokens resolve; not bundled into the app.
import type { ReactElement } from 'react';
import { Heading, Text, Caption, Label } from './typography';

type Story = () => ReactElement;

const meta = { title: 'UI/Typography' };
export default meta;

export const Headings: Story = () => (
  <div className="flex flex-col gap-3">
    <Heading level="display">Display ตั้งวง</Heading>
    <Heading level={1}>Heading 1</Heading>
    <Heading level={2}>Heading 2</Heading>
    <Heading level={3}>Heading 3</Heading>
    <Heading level={1} gradient>Gradient heading</Heading>
    <Heading level={2} thai>หัวข้อภาษาไทย</Heading>
  </div>
);

export const BodyText: Story = () => (
  <div className="flex flex-col gap-2">
    <Text>Default body text for descriptions and content.</Text>
    <Text tone="muted">Muted secondary text.</Text>
    <Text tone="primary" weight="semibold">Primary emphasised text.</Text>
    <Caption>Caption — small print and timestamps</Caption>
    <Label htmlFor="x">Section label</Label>
  </div>
);
