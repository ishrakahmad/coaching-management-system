import { ReactNode } from 'react';

interface DataTableProps {
  columns: (string | { label: string; align?: 'right' })[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyMessage: ReactNode;
  children: ReactNode;
  className?: string;
  /** Inside a Panel: no own border, radius or margin. */
  bare?: boolean;
}

/** Table shell with consistent loading / error / empty rows. Rows are passed as children. */
export function DataTable({ columns, isLoading, isError, isEmpty, emptyMessage, children, className = 'mt-6', bare = false }: DataTableProps) {
  const cols = columns.map((c) => (typeof c === 'string' ? { label: c } : c));
  const stateRow = (content: ReactNode, tone = 'text-ink/40') => (
    <tr>
      <td colSpan={cols.length} className={`px-4 py-10 text-center ${tone}`}>
        {content}
      </td>
    </tr>
  );

  return (
    <div className={bare ? 'overflow-x-auto' : `${className} rounded-xl border border-border bg-white overflow-x-auto`}>
      <table className="w-full text-sm">
        <thead className="bg-teal-50 text-teal-800 text-left">
          <tr>
            {cols.map((column) => (
              <th key={column.label} scope="col" className={`px-4 py-3 font-medium whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? stateRow('Loading...')
            : isError
              ? stateRow('Data load করা যায়নি। Backend চলছে কিনা দেখুন।', 'text-danger-600')
              : isEmpty
                ? stateRow(emptyMessage)
                : children}
        </tbody>
      </table>
    </div>
  );
}

/** A table row that opens the item on click/Enter. Without onOpen it's a plain, non-interactive row. */
export function RowButton({ onOpen, children, className = '' }: { onOpen?: () => void; children: ReactNode; className?: string }) {
  if (!onOpen) return <tr className={`border-t border-border ${className}`}>{children}</tr>;
  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return; // let buttons inside the row handle their own keys
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`border-t border-border cursor-pointer hover:bg-paper/70 outline-none focus-visible:bg-teal-50 ${className}`}
    >
      {children}
    </tr>
  );
}
