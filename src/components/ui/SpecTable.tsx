import { cn } from '@/lib/utils'

interface SpecTableProps {
  specs: Record<string, string>
  title?: string
}

export function SpecTable({ specs, title }: SpecTableProps) {
  const entries = Object.entries(specs)

  return (
    <div>
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      )}
      <table className="w-full text-left">
        <tbody>
          {entries.map(([key, value], index) => (
            <tr
              key={key}
              className={cn(index % 2 === 0 ? 'bg-gray-50' : 'bg-white')}
            >
              <td className="px-4 py-3 font-medium text-gray-700 w-1/3">
                {key}
              </td>
              <td className="px-4 py-3 text-gray-900">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
