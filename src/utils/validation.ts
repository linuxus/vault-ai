import { z } from 'zod';

/**
 * Vault token validation
 */
export const tokenSchema = z
  .string()
  .min(1, 'Token is required')
  .regex(/^(hvs\.|s\.|[a-zA-Z0-9-]+)/, 'Invalid token format');

/**
 * Vault URL validation
 */
export const vaultUrlSchema = z
  .string()
  .min(1, 'Vault URL is required')
  .url('Invalid URL format')
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  });

/**
 * Secret path validation (KV path)
 */
export const secretPathSchema = z
  .string()
  .min(1, 'Path is required')
  .regex(/^[a-zA-Z0-9_\-/]+$/, 'Path contains invalid characters')
  .refine((path) => !path.startsWith('/'), {
    message: 'Path should not start with /',
  })
  .refine((path) => !path.includes('//'), {
    message: 'Path should not contain double slashes',
  });

/**
 * Secret key validation
 */
export const secretKeySchema = z
  .string()
  .min(1, 'Key is required')
  .max(256, 'Key is too long')
  .regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/, 'Key must start with letter or underscore');

/**
 * Secret data validation (key-value pairs)
 */
export const secretDataSchema = z.record(
  secretKeySchema,
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

/**
 * Login form validation
 */
export const loginFormSchema = z.object({
  token: tokenSchema,
  vaultUrl: vaultUrlSchema,
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Secret form validation
 */
export const secretFormSchema = z.object({
  path: secretPathSchema,
  data: z.record(z.string(), z.string()),
});

export type SecretFormData = z.infer<typeof secretFormSchema>;

/**
 * Validate and return errors or null
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return { success: false, errors };
}
