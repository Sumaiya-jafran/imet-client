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
            url: z.string().max(2000).optional(),
            assetId: z.uuid().nullable().optional(),
            alt: text(250),
          })
          .strict()
          .superRefine((image, ctx) => {
            if (image.assetId) {
              if (
                image.url &&
                image.url !== `/catalogue/images/${image.assetId}/content`
              )
                ctx.addIssue({
                  code: 'custom',
                  path: ['url'],
                  message: 'Invalid managed image reference',
                });
            } else {
              let safe = false;
              try {
                const url = new URL(image.url || '');
                safe =
                  url.protocol === 'https:' && !url.username && !url.password;
              } catch {}
              if (!safe)
                ctx.addIssue({
                  code: 'custom',
                  path: ['url'],
                  message: 'Use an HTTPS URL without embedded credentials',
                });
            }
          }),
      )
      .max(20),
    specifications: z
      .array(z.object({ label: text(100), value: text(500) }).strict())
      .max(100),
  })
  .strict();
export type MachineInput = z.infer<typeof machineSchema>;
