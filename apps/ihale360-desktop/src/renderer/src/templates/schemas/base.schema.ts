import { z } from 'zod'

export const MetaSchema = z.object({
  templateId: z.string(),
  templateVersion: z.string(),
  documentNumber: z.string().optional(),
  date: z.string().optional()
})

export const InstitutionSchema = z.object({
  name: z.string(),
  department: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  kep: z.string().optional().or(z.literal('')),
  logo: z
    .object({
      left: z.string().optional(),
      right: z.string().optional()
    })
    .optional()
})

export const HeaderSchema = z.object({
  title: z.string(),
  lines: z.array(z.string()).optional()
})

export const ApprovalSchema = z.object({
  required: z.boolean().default(false),
  personName: z.string().optional(),
  personTitle: z.string().optional(),
  date: z.string().optional()
})
