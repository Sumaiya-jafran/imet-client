import { z } from 'zod';
const text = (max: number) => z.string().trim().min(1, 'Required').max(max);
const slug = (max: number) =>
  text(max).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens',
  );
export const categorySchema = z
  .object({ name: text(100), slug: slug(120) })
  .strict();
export const machineSchema = z
  .object({
    name: text(200),
    slug: slug(220),
    description: text(20000),
    manufacturer: text(200),
    model: text(200),
    categoryId: z.uuid('Select a category'),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    images: z
      .array(
        z
          .object({
            url: z
              .url()
              .max(2000)
              .refine((value) => {
                let url: URL;
                try {
                  url = new URL(value);
                } catch {
                  return false;
                }
                return (
                  url.protocol === 'https:' && !url.username && !url.password
                );
              }, 'Use an HTTPS URL without embedded credentials'),
            alt: text(250),
          })
          .strict(),
      )
      .max(20),
    specifications: z
      .array(z.object({ label: text(100), value: text(500) }).strict())
      .max(100),
  })
  .strict();
export type MachineInput = z.infer<typeof machineSchema>;
