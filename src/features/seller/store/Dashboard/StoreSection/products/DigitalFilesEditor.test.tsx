import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { DigitalFileRow } from './digitalFiles';

// The upload widget talks to the storage service; it is not what this test is about.
vi.mock('@/components/comman/ui', () => ({ FileUpload: ({ label }: { label: string }) => <div>{label}</div> }));

import { DigitalFilesEditor } from './DigitalFilesEditor';

afterEach(() => cleanup());

const row = { url: 'private/digital-products/a', name: 'guide.pdf', label: '', version: '', mimeType: 'application/pdf', stampPdf: false } as unknown as DigitalFileRow;

describe('DigitalFilesEditor', () => {
  it('warns (without blocking) when the product has no file yet', () => {
    render(<DigitalFilesEditor value={[]} onChange={() => undefined} />);
    expect(screen.getByRole('note')).toHaveTextContent(/nothing to download/i);
    expect(screen.getByText('Click to upload your digital file')).toBeInTheDocument();
  });

  it('shows no warning once a file is attached', () => {
    render(<DigitalFilesEditor value={[row]} onChange={() => undefined} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.getByText('Add another file')).toBeInTheDocument();
  });
});
