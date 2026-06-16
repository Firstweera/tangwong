import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge class names conditionally (clsx) and resolve Tailwind conflicts
 * (tailwind-merge), so the last utility wins. Use for every className that may
 * combine base + variant + caller overrides.
 *
 *   cn('px-4 py-2', isActive && 'bg-primary', className)
 *   cn('p-2', 'p-4') // -> 'p-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export default cn;
