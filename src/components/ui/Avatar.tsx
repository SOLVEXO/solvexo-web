import { clsx } from 'clsx';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  variant?: 'default' | 'pos' | 'green';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const variantClasses = {
  default: 'bg-brand-pale-orange text-brand-deep-orange',
  pos:     'bg-[#2C2A28] text-brand-orange',
  green:   'bg-success-bg text-success',
};

export function Avatar({ name, size = 32, className, variant = 'default' }: AvatarProps) {
  const fontSize = Math.round(size * 0.35);

  return (
    <div
      className={clsx(
        'flex-shrink-0 flex items-center justify-center rounded-full font-bold',
        variantClasses[variant],
        className,
      )}
      style={{ width: size, height: size, fontSize }}
    >
      {getInitials(name)}
    </div>
  );
}
