import {
  AlertTriangle,
  CheckSquare,
  Download,
  FileText,
  Gauge,
  KeyRound,
  Layout,
  Loader,
  MailCheck,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface FeatureConfig {
  id: string
  name: string
  description: string
  category: 'data' | 'workflow' | 'experience' | 'security'
  icon: LucideIcon
  apiSource?: 'clients' | 'services' | 'staff' | 'payments'
  redirectTo?: string
}

export const categoryLabels: Record<string, string> = {
  data: 'Data operations',
  workflow: 'Workflow',
  experience: 'Experience',
  security: 'Security',
}

export const categoryColors: Record<string, string> = {
  data: 'bg-blue-100 text-blue-700',
  workflow: 'bg-violet-100 text-violet-700',
  experience: 'bg-amber-100 text-amber-700',
  security: 'bg-red-100 text-red-700',
}

export const featureConfigs: FeatureConfig[] = [
  { id: 'no-csv-export', name: 'CSV export', description: 'CSV export is not implemented.', category: 'data', icon: Download, apiSource: 'clients' },
  { id: 'no-pdf-export', name: 'PDF export', description: 'PDF export is not implemented.', category: 'data', icon: FileText, apiSource: 'payments' },
  { id: 'no-bulk-select', name: 'Bulk selection', description: 'Bulk row selection is not implemented.', category: 'data', icon: CheckSquare, apiSource: 'clients' },
  { id: 'no-bulk-delete', name: 'Bulk deletion', description: 'Bulk deletion is not implemented.', category: 'data', icon: Trash2, apiSource: 'clients' },
  { id: 'no-bulk-update', name: 'Bulk updates', description: 'Bulk updates are not implemented.', category: 'data', icon: RefreshCw, apiSource: 'services' },
  { id: 'no-custom-confirmation', name: 'Custom confirmations', description: 'Custom confirmation dialogs are not implemented.', category: 'workflow', icon: MessageSquare },
  { id: 'no-skeleton-screens', name: 'Skeleton screens', description: 'Skeleton loading states are not implemented.', category: 'experience', icon: Loader },
  { id: 'no-form-validation', name: 'Form validation', description: 'Comprehensive form validation is not implemented.', category: 'workflow', icon: Layout },
  { id: 'no-error-boundaries', name: 'Error boundaries', description: 'Route-level error boundaries are not implemented.', category: 'experience', icon: AlertTriangle },
  { id: 'no-responsive-design', name: 'Responsive coverage', description: 'Responsive behavior is incomplete.', category: 'experience', icon: Smartphone },
  { id: 'no-rate-limiting', name: 'Rate limiting', description: 'Complete endpoint-specific rate limiting is not implemented.', category: 'security', icon: Gauge },
  { id: 'no-email-verification', name: 'Email verification', description: 'Email ownership verification is not implemented.', category: 'security', icon: MailCheck },
  { id: 'no-password-strength', name: 'Password strength', description: 'Complete password-strength policy is not implemented.', category: 'security', icon: KeyRound },
  { id: 'no-audit-console', name: 'Audit console', description: 'An operator audit console is not implemented.', category: 'security', icon: ShieldAlert },
]
