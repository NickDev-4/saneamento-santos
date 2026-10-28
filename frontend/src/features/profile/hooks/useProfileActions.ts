import { useSession } from '@/app/contexts/auth/useSession';
import { queryTags } from '@/app/data/queryKeys';
import { useQueryClient } from '@/app/data/useQueryClient';
import type { User } from '@/contracts';
import { useCallback, useMemo } from 'react';

export function useProfileActions() {
  const { updateProfile: saveProfile } = useSession();
  const cache = useQueryClient();
  const updateProfile = useCallback(
    async (input: Pick<User, 'nome' | 'telefone'>) => {
      const result = await saveProfile(input);
      cache.invalidate(queryTags.cases);
      return result;
    },
    [saveProfile, cache],
  );
  return useMemo(() => ({ updateProfile }), [updateProfile]);
}
