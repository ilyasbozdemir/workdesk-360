import { z } from 'zod'

export const AppCategorySchema = z.enum([
  'procurement',       // Kamu alımları ve ihale
  'file-management',  // Dosya arama, düzenleme ve temizlik
  'workflow',         // Süreç ve görev takibi
  'gis',              // Harita, koordinat ve taşınmaz
  'hr',               // Personel yönetimi
  'document',         // Belge yönetimi ve resmi yazışma
  'archive',          // Arşivleme ve kayıt saklama
  'system'            // Sistem ve ekosistem yönetimi
])

export type AppCategory = z.infer<typeof AppCategorySchema>

export const AppInstallStateSchema = z.enum([
  'installed',        // Kurulu ve çalışmaya hazır
  'not_installed',    // Kurulu değil fakat kurulum paketi mevcut
  'planned',          // Yol haritasında / geliştirme aşamasında
  'update_available'  // Kurulu ancak yeni sürüm mevcut
])

export type AppInstallState = z.infer<typeof AppInstallStateSchema>

export const FileAssociationSchema = z.object({
  ext: z.string().min(1),
  name: z.string(),
  description: z.string(),
  mimeType: z.string().min(3).optional(),
  progId: z.string().optional(),
  perceivedType: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isLegacy: z.boolean().optional()
})

export type FileAssociation = z.infer<typeof FileAssociationSchema>

export const AppManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'Manifest ID must be kebab-case lowercase'),
  name: z.string().min(2),
  version: z.string().min(1),
  description: z.string().min(10),
  summary: z.string().min(5),
  category: AppCategorySchema,
  appId: z.string().min(3),
  executableName: z.string().min(3),
  fileAssociations: z.array(FileAssociationSchema).default([]),
  installState: AppInstallStateSchema,
  modules: z.array(z.string()).default([]),
  releaseChannel: z.enum(['stable', 'rc', 'beta', 'alpha', 'planned']).default('stable'),
  minEcosystemVersion: z.string().default('1.0.0'),
  author: z.string().default('ilyasbozdemir.dev'),
  websiteUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  installedPath: z.string().optional(),
  sizeEstimatedMb: z.number().positive().optional()
})

export type AppManifest = z.infer<typeof AppManifestSchema>

export function validateManifest(manifest: unknown): AppManifest {
  return AppManifestSchema.parse(manifest)
}

export function isValidManifest(manifest: unknown): manifest is AppManifest {
  return AppManifestSchema.safeParse(manifest).success
}
