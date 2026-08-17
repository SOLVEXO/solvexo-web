import { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

interface StarRatingProps {
  value:      number;
  onChange?:  (v: number) => void;
  size?:      number;
  className?: string;
}

// Read-only when `onChange` is omitted; otherwise an interactive 1-5 picker
// (used both for displaying a review's rating and for submitting a new one).
export function StarRating({ value, onChange, size = 13, className }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;
  const display = interactive && hovered > 0 ? hovered : value;

  return (
    <span className={clsx('inline-flex items-center gap-[2px]', className)}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => onChange?.(i)}
          className={clsx(
            i <= display ? 'text-brand-orange fill-brand-orange' : 'text-bone fill-bone',
            interactive && 'cursor-pointer',
          )}
        />
      ))}
    </span>
  );
}
