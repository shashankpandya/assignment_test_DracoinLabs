import { z } from 'zod';

export const CertificateFormSchema = z.object({
  studentId: z.coerce.number().int().positive('Student is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(400, 'Description must be at most 400 characters').optional(),
  issuedDate: z.union([z.date(), z.string()]),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Recipient wallet address is invalid')
});
