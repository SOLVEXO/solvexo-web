import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';

export function LedupSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the box when the overlay closes
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-start bg-stone-900/40 backdrop-blur-md ld-pop">
      {/* Top bar with close button */}
      <div className="flex w-full items-center justify-end px-6 py-5 md:px-12">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-md transition-all hover:bg-white hover:text-stone-900"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main search panel with large input line */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 md:pt-24">
        <div className="rounded-[32px] bg-white/95 p-8 shadow-2xl backdrop-blur md:p-14">
          <form onSubmit={handleSubmit} className="flex items-center gap-4 border-b-2 border-stone-200 pb-3 transition-colors focus-within:border-stone-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Procurar por nome, referência..."
              className="w-full bg-transparent text-xl font-light text-stone-900 placeholder:text-stone-400 focus:outline-none md:text-3xl"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-800 shadow-sm transition-all hover:border-stone-900 hover:bg-stone-900 hover:text-white"
            >
              <ArrowUpRight size={26} strokeWidth={1.75} />
            </button>
          </form>

          {/* Quick search suggestions */}
          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="font-medium text-stone-700">Sugestões:</span>
            {['Downlights', 'Tracklights', 'NEXUS', 'ALCOR', '3CCT', 'Perfis LED'].map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  navigate(`/search?q=${encodeURIComponent(item)}`);
                  onClose();
                }}
                className="rounded-full bg-stone-100 px-3.5 py-1 text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
