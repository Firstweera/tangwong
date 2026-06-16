import { useCallback, useState } from 'react';

/**
 * useControllableState — supports both controlled and uncontrolled usage.
 * If `value` is provided the component is controlled; otherwise internal state
 * is used and `onChange` is still notified.
 */
export function useControllableState<T>(opts: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const { value, defaultValue, onChange } = opts;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);
  const current = isControlled ? (value as T) : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
