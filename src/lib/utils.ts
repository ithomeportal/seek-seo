export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPhone(phone: string): string {
  return phone.replace(
    /(\d)[-.](\d{3})[-.](\d{3})[-.](\d{4})/,
    '$1-$2-$3-$4'
  )
}
