import { useState } from 'react';
import { apiEditProfile, type EditProfilePayload, type ProfileData } from '@/api/commerce/auth';

export function useEditProfile() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  async function execute(payload: EditProfilePayload): Promise<ProfileData | null> {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const res = await apiEditProfile(payload);
      setSuccess(true);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { execute, loading, error, success };
}
