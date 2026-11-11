import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let credits: Record<string, unknown> | null = null;

vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1' }),
  StorePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/hooks/auth/useCan', () => ({ can: () => true }));
vi.mock('@/hooks/seller/useAiStudio', () => ({
  useAiStudioCredits: () => ({ data: credits, loading: false, refetch: vi.fn() }),
}));
vi.mock('./components/CreditsHeader', () => ({ CreditsHeader: () => null }));
vi.mock('./tools/ListingWriterTool', () => ({ ListingWriterTool: () => <div>listing-tool</div> }));
vi.mock('./tools/SeoBoosterTool', () => ({ SeoBoosterTool: () => <div>seo-tool</div> }));
vi.mock('./tools/EmailCampaignsTool', () => ({ EmailCampaignsTool: () => null }));
vi.mock('./tools/WorksheetBuilderTool', () => ({ WorksheetBuilderTool: () => null }));
vi.mock('./tools/PriceOptimizerTool', () => ({ PriceOptimizerTool: () => null }));
vi.mock('./tools/ImageEnhancerTool', () => ({ ImageEnhancerTool: () => <div>image-tool</div> }));

import { StoreAIStudio } from './AiStudio';

afterEach(cleanup);
beforeEach(() => { credits = null; });

describe('AiStudio textAvailable', () => {
  it('shows a notice and disables the text tools when textAvailable is false', () => {
    credits = { textAvailable: false, imageEnhancerAvailable: false };
    render(<StoreAIStudio />);
    expect(screen.getByText(/not available yet\. No credits are used/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Listing Writer/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /SEO Booster/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('listing-tool')).toBeNull();
    expect(screen.queryByRole('button', { name: /Image Enhancer/ })).toBeNull();
  });

  it('works as before when textAvailable is true', () => {
    credits = { textAvailable: true, imageEnhancerAvailable: false };
    render(<StoreAIStudio />);
    expect(screen.queryByText(/not available yet/)).toBeNull();
    expect(screen.getByText('listing-tool')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /SEO Booster/ }));
    expect(screen.getByText('seo-tool')).toBeTruthy();
  });

  it('works as before when the API does not send textAvailable', () => {
    credits = { imageEnhancerAvailable: true };
    render(<StoreAIStudio />);
    expect(screen.queryByText(/not available yet/)).toBeNull();
    expect((screen.getByRole('button', { name: /Listing Writer/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: /Image Enhancer/ })).toBeTruthy();
  });
});
