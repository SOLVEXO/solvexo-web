import { ArrowLeft } from 'lucide-react';
import { ActionMenu, type ActionMenuItem } from '@/components/comman/ui';
import { ChatAvatar } from './ChatAvatar';

interface ChatHeaderProps {
  name:       string;
  image?:     string | null;
  subtitle?:  string;
  menuItems:  ActionMenuItem[];
  onBack?:    () => void;
}

// Thread header: avatar + name/status on the left, a single kebab menu on
// the right for all thread actions — exactly how Instagram and WhatsApp
// tuck archive/mute/block/report behind one "⋮" instead of a button row.
export function ChatHeader({ name, image, subtitle, menuItems, onBack }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-[#EEECE4] px-4 py-[10px] flex items-center gap-[10px] shrink-0">
      {onBack && (
        <button onClick={onBack} className="md:hidden p-1 -ml-1 rounded-full hover:bg-cream cursor-pointer bg-transparent border-none text-charcoal">
          <ArrowLeft size={19} />
        </button>
      )}
      <ChatAvatar name={name} image={image} size={38} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-charcoal leading-[1.25] truncate">{name}</p>
        {subtitle && <p className="text-[11.5px] text-slate truncate">{subtitle}</p>}
      </div>
      <ActionMenu items={menuItems} align="right" />
    </div>
  );
}
