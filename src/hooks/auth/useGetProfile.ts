import { apiGetProfile, TokenStorage, type ProfileData } from '@/api/services/auth';
import { createSharedResource } from '@/hooks/createSharedResource';

// Shared across every component that calls useGetProfile() — the profile is one
// global resource, so simultaneous mounts (layouts, headers, settings pages…)
// dedupe onto a single request/cache instead of each firing its own.
const profileResource = createSharedResource<ProfileData | null>(
  () => TokenStorage.isLoggedIn() ? apiGetProfile().then(res => res.data) : Promise.resolve(null),
  // Survives a hard reload — see createSharedResource's own doc comment.
  // Cleared on logout (useLogout) so a different account signing in on the
  // same browser never briefly shows the previous user's name/avatar.
  { storageKey: 'solvexo:profile' },
);

export const invalidateProfileCache = profileResource.invalidate;

export function useGetProfile() {
  const { data, loading, error, refetch } = profileResource.useSharedResource();
  return {
    profile: data,
    loading: TokenStorage.isLoggedIn() ? loading : false,
    error,
    refetch,
  };
}
