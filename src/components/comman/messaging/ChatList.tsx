import { Loader2, Search, SquarePen } from 'lucide-react';
import { ChatListItem } from './ChatListItem';

export interface ChatListEntry {
  id:      string;
  name:    string;
  image?:  string | null;
  preview: string;
  time:    string;
  unread:  number;
  pinned?: boolean;
  muted?:  boolean;
}

interface ChatListProps {
  title:        string;
  entries:      ChatListEntry[];
  activeId:     string | null;
  onSelect:     (id: string) => void;
  query:        string;
  onQueryChange: (v: string) => void;
  loading:      boolean;
  error?:       string;
  onNew?:       () => void;
}

// The left-hand thread list: a title row (with an optional "new message"
// pencil icon, Instagram-style), a search field, then the list itself.
export function ChatList({ title, entries, activeId, onSelect, query, onQueryChange, loading, error, onNew }: ChatListProps) {
  return (
    <div className="w-full md:w-[340px] shrink-0 border-r border-[#EEECE4] flex flex-col bg-white h-full">
      <div className="px-4 pt-4 pb-[10px] flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-charcoal">{title}</h2>
        {onNew && (
          <button onClick={onNew} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream cursor-pointer bg-transparent border-none text-charcoal">
            <SquarePen size={19} />
          </button>
        )}
      </div>

      <div className="px-4 pb-[10px]">
        <div className="flex items-center gap-[8px] bg-cream rounded-full px-[12px] py-[8px]">
          <Search size={15} className="text-slate shrink-0" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-charcoal"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-brand-orange" /></div>
        ) : error ? (
          <p className="p-4 text-[12px] text-error text-center">{error}</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-[13px] text-slate text-center">No conversations yet.</p>
        ) : (
          entries.map(entry => (
            <ChatListItem
              key={entry.id}
              name={entry.name}
              image={entry.image}
              preview={entry.preview}
              time={entry.time}
              unread={entry.unread}
              pinned={entry.pinned}
              muted={entry.muted}
              active={entry.id === activeId}
              onClick={() => onSelect(entry.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
