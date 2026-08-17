import { Construction } from 'lucide-react';

interface ComingSoonBannerProps {
  message?: string;
}

// Flags a page whose controls aren't wired to a backend yet, so a user can't
// mistake dead buttons for a feature that silently failed.
export function ComingSoonBanner({ message = "This section isn't connected to live data yet — you're viewing a preview of the layout." }: ComingSoonBannerProps) {
  return (
    <div className="flex items-start gap-[10px] px-4 py-3 rounded-[10px] bg-brand-pale-orange border border-brand-orange/25">
      <Construction size={15} className="text-brand-orange mt-[1px] shrink-0" />
      <p className="text-[12.5px] text-brand-deep-orange leading-[1.5]">{message}</p>
    </div>
  );
}
