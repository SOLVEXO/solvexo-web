import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface CopyIconButtonProps {
  /** The text actually copied to the clipboard — not necessarily what's displayed next to it. */
  value: string;
  title?: string;
  size?: number;
  className?: string;
}

/** Small icon-only copy-to-clipboard button — same interaction as
 *  StoreInfoCard's store-URL copy button (icon swaps to a checkmark for
 *  ~1.6s), generalized so every "name + email" account display (buyer's
 *  ProfileAvatar dropdown, Seller/Admin sidebar footers) can copy the email
 *  next to it without each re-implementing the same little state machine. */
export function CopyIconButton({ value, title = 'Copy', size = 12, className }: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : title}
      aria-label={copied ? 'Copied' : title}
      className={clsx(
        'shrink-0 border-0 bg-transparent p-0.5 rounded-sm cursor-pointer transition-transform active:scale-90',
        className,
      )}
    >
      {copied ? <Check size={size} className="text-[#22c55e]" /> : <Copy size={size} />}
    </button>
  );
}
