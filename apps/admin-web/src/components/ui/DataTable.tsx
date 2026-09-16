import { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

/** Table shell with consistent loading / error / empty rows. Rows are passed as children. */
export function DataTable({ columns, isLoading, isError, isEmpty, emptyMessage, children }: DataTableProps) {
  const stateRow = (content: ReactNode, className = 'text-ink/40') => (
    <tr>
      <td colSpan={columns.length} className={`px-4 py-8 text-center ${className}`}>
        {content}
      </td>
    </tr>
  );

  return (
    <div className="mt-6 rounded-xl border border-border bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-teal-50 text-teal-800 text-left">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? stateRow('Loading...')
            : isError
              ? stateRow('Data load করা যায়নি। Backend চলছে কিনা check করুন।', 'text-red-600')
              : isEmpty
                ? stateRow(emptyMessage)
                : children}
        </tbody>
      </table>
    </div>
  );
}
