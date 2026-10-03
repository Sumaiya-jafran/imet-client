import { z } from 'zod';
const envSchema = z.object({
  NEXT_PUBLIC_BACKEND_API_URL: z.url().default('http://localhost:5000/api/v1'),
  NEXT_PUBLIC_BACKEND_BASE_URL: z.url().default('http://localhost:5000'),
});
export const config = envSchema.parse({
  NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  NEXT_PUBLIC_BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
});
