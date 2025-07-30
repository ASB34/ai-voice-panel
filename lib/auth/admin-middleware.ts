import { z } from 'zod';
import { AdminUser } from '@/lib/db/schema';
import { requireAdminAuth, AdminSession } from '@/lib/auth/admin-auth';

export type AdminActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type ValidatedAdminActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  admin: AdminSession
) => Promise<T>;

export function validatedAdminAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedAdminActionFunction<S, T>
) {
  return async (
    _state: any,
    formData: FormData
  ): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: 'Invalid form data' } as T;
    }

    const admin = await requireAdminAuth();
    return action(result.data, formData, admin);
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  return await requireAdminAuth();
}
