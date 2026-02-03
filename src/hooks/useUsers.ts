import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UpdateUserData {
    userId: string;
    name?: string;
    username?: string | null;
    role?: 'SUPER_ADMIN' | 'PHARMACIST' | 'DISPENSER';
}

export function useUsers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch users with caching
    const { data: users = [], isLoading, error, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            console.log('[useUsers] Fetching users...');

            // Get auth users via edge function
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            let authUsers: Array<{ id: string; email: string }> = [];

            if (accessToken) {
                const response = await supabase.functions.invoke('list-users', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.error) {
                    authUsers = response.data?.users || [];
                }
            }

            // Fetch profiles and roles in a single optimized query
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select(`
          id,
          user_id,
          name,
          username
        `);

            if (profilesError) throw profilesError;

            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role');

            if (rolesError) throw rolesError;

            const rolesMap = new Map((rolesData || []).map(r => [r.user_id, r.role]));
            const authUsersMap = new Map(authUsers.map(u => [u.id, u.email]));

            const usersList: User[] = (profiles || []).map((profile: any) => ({
                id: profile.user_id,
                email: authUsersMap.get(profile.user_id) || '',
                name: profile.name,
                username: profile.username || undefined,
                role: (rolesMap.get(profile.user_id) || 'DISPENSER') as 'SUPER_ADMIN' | 'PHARMACIST' | 'DISPENSER',
                currency_symbol: '₦',
            }));

            console.log('[useUsers] Fetched', usersList.length, 'users');
            return usersList;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    });

    // Update user mutation with optimistic updates
    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, name, username, role }: UpdateUserData) => {
            console.log('[useUsers] Updating user:', userId);

            // Update profiles table
            if (name !== undefined || username !== undefined) {
                const updateData: any = {};
                if (name !== undefined) updateData.name = name;
                if (username !== undefined) updateData.username = username || null;

                const { error: profileError } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('user_id', userId);

                if (profileError) throw profileError;
            }

            // Update role if provided
            if (role !== undefined) {
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .update({ role })
                    .eq('user_id', userId);

                if (roleError) throw roleError;
            }

            return { userId, name, username, role };
        },
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['users'] });

            // Snapshot previous value
            const previousUsers = queryClient.getQueryData<User[]>(['users']);

            // Optimistically update
            queryClient.setQueryData<User[]>(['users'], (old = []) =>
                old.map(user =>
                    user.id === variables.userId
                        ? {
                            ...user,
                            ...(variables.name !== undefined && { name: variables.name }),
                            ...(variables.username !== undefined && { username: variables.username || undefined }),
                            ...(variables.role !== undefined && { role: variables.role as 'SUPER_ADMIN' | 'PHARMACIST' | 'DISPENSER' }),
                        }
                        : user
                )
            );

            return { previousUsers };
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousUsers) {
                queryClient.setQueryData(['users'], context.previousUsers);
            }

            console.error('[useUsers] Update failed:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update user',
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['users'] });

            toast({
                title: 'Success',
                description: 'User profile has been updated successfully.',
            });
        },
    });

    return {
        users,
        isLoading,
        error,
        refetch,
        updateUser: updateUserMutation.mutate,
        isUpdating: updateUserMutation.isPending,
    };
}
