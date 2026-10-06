import { useState } from 'react';
import { Upload } from 'lucide-react';
import { BulkImportDialog, type BulkImportDialogProps } from './BulkImportDialog';

type Props = Omit<BulkImportDialogProps, 'onClose' | 'title'> & {
  /** Dialog title; defaults to "Import <entityLabel>". */
  title?: string;
  /** Button text (hidden on very small screens); default "Import". */
  label?: string;
  className?: string;
};

const DEFAULT_CLASS =
  'flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-2.5 sm:px-4 py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50';

/** Drop-in "Import" button + dialog for any list page: `<BulkImportButton entityLabel="customers" basePath="/api/..." onImported={reload} />`. */
export function BulkImportButton({ title, label = 'Import', className, entityLabel, ...dialog }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? DEFAULT_CLASS}>
        <Upload size={14} />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {open && (
        <BulkImportDialog
          {...dialog}
          entityLabel={entityLabel}
          title={title ?? `Import ${entityLabel}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
