import { z } from 'zod';

const PORT_DEFAULT = 3000;

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(PORT_DEFAULT),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, any>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const error = new Error(z.prettifyError(result.error));
    error.name = 'InvalidEnv';
    throw error;
  }
  return result.data;
}
