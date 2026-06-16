import { useState, type ReactElement } from 'react';
import { Input, TextArea, SearchInput, Field } from './input';

type Story = () => ReactElement;

const meta = { title: 'UI/Input' };
export default meta;

export const Basic: Story = () => (
  <div className="flex flex-col gap-3" style={{ maxWidth: 320 }}>
    <Input placeholder="Room name" />
    <Input placeholder="Disabled" disabled />
    <TextArea placeholder="Say something to the table…" />
  </div>
);

export const WithField: Story = () => (
  <Field invalid style={{ maxWidth: 320 }}>
    <Field.Label>Room code</Field.Label>
    <Input placeholder="e.g. TANG42" />
    <Field.Hint>6 characters, shared with friends.</Field.Hint>
    <Field.Error>That room code is taken.</Field.Error>
  </Field>
);

export const Search: Story = () => {
  const [q, setQ] = useState('avalon');
  return (
    <div style={{ maxWidth: 320 }}>
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
    </div>
  );
};
