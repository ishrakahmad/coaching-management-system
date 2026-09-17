import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { useToast } from '../components/ui/Toast';
import { getErrorMessage } from '../lib/api-error';

interface Options<TData> {
  /** Query keys to refresh after success, e.g. [['students'], ['fees']]. */
  invalidate?: QueryKey[];
  success?: string | ((data: TData) => string);
  onSuccess?: (data: TData) => void;
}

const isAxiosResponse = (value: unknown): value is AxiosResponse =>
  !!value && typeof value === 'object' && 'data' in value && 'status' in value && 'config' in value;

/**
 * useMutation + cache refresh + success/error toast, the same way everywhere.
 * `fn` may return an axios response; callbacks receive the response body.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApiMutation<TVars = void, TData = any>(fn: (vars: TVars) => Promise<unknown>, options: Options<TData> = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<TData, unknown, TVars>({
    mutationFn: async (vars) => {
      const result = await fn(vars);
      return (isAxiosResponse(result) ? result.data : result) as TData;
    },
    onSuccess: async (data) => {
      await Promise.all((options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (options.success) toast('success', typeof options.success === 'function' ? options.success(data) : options.success);
      options.onSuccess?.(data);
    },
    onError: (error) => toast('error', getErrorMessage(error)),
  });
}
