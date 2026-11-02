import { afterEach, describe, expect, it } from 'vitest';
import { campaignTags, rememberCampaignTags } from './campaignTags';

afterEach(() => sessionStorage.clear());

describe('campaign tags', () => {
  it('keeps the first tags of the visit, and the current URL wins', () => {
    rememberCampaignTags('?utm_source=facebook&utm_campaign=eid-sale');
    rememberCampaignTags('?utm_source=google');
    expect(campaignTags('')).toEqual({ utmSource: 'facebook', utmCampaign: 'eid-sale' });
    expect(campaignTags('?utm_medium=email')).toEqual({ utmMedium: 'email' });
  });
});
