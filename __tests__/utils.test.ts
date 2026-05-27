import { cn } from '../lib/utils';

describe('cn utility function', () => {
  it('should merge classes correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn('bg-red-500', isFalse && 'text-white', isTrue && 'p-4')).toBe('bg-red-500 p-4');
  });

  it('should merge tailwind classes properly', () => {
    // tailwind-merge should resolve conflicting padding classes by taking the last one
    expect(cn('p-2 p-4')).toBe('p-4');
  });
});
