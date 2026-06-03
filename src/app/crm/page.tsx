import type { Metadata } from 'next'
import OtpLogin from '@/components/auth/OtpLogin'

export const metadata: Metadata = {
  title: 'Sales CRM',
  robots: { index: false, follow: false },
}

export default function CrmLoginPage() {
  return <OtpLogin redirectTo="/admin/dashboard?tab=crm" title="Sales CRM" />
}
