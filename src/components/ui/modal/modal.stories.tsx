import { useState, type ReactElement } from 'react';
import { Modal } from './modal';
import { Button } from '../button';

type Story = () => ReactElement;

const meta = { title: 'UI/Modal' };
export default meta;

// Uncontrolled — Trigger opens, Close/backdrop/Escape close.
export const Uncontrolled: Story = () => (
  <Modal.Root>
    <Modal.Trigger>
      <Button>Leave room</Button>
    </Modal.Trigger>
    <Modal.Content>
      <Modal.Header>
        <Modal.Title>Leave this room?</Modal.Title>
        <Modal.Close />
      </Modal.Header>
      <Modal.Description>You can rejoin with the room code while the game is open.</Modal.Description>
      <Modal.Footer>
        <Modal.Close className="!h-[54px] !w-auto flex-1 !rounded-2xl !bg-surface-2 !px-5 font-bold">Stay</Modal.Close>
        <Button variant="evil" block>Leave</Button>
      </Modal.Footer>
    </Modal.Content>
  </Modal.Root>
);

// Controlled — parent owns the open state.
export const Controlled: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="glass" onClick={() => setOpen(true)}>Open controlled</Button>
      <Modal.Root open={open} onOpenChange={setOpen}>
        <Modal.Content>
          <Modal.Title>Controlled dialog</Modal.Title>
          <Modal.Description>State lives in the parent component.</Modal.Description>
          <Modal.Footer>
            <Button block onClick={() => setOpen(false)}>Got it</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};
