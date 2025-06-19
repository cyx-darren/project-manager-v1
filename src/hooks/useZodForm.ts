import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { z } from 'zod';

/**
 * Custom hook that integrates React Hook Form with Zod validation
 * Provides type-safe form handling with automatic TypeScript inference
 */
export function useZodForm<T extends ZodType<any, any>>(
  schema: T
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur for better UX
  });
} 