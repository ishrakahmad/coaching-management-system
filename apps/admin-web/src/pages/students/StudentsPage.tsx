import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function StudentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((r) => r.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Students</h1>
          <p className="text-sm text-ink/50 mt-1">সব student-এর তালিকা</p>
        </div>
        <button className="rounded-lg bg-teal-800 text-paper text-sm font-medium px-4 py-2.5 hover:bg-teal-900 transition">
          + নতুন Student
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-teal-50 text-teal-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Student ID</th>
              <th className="px-4 py-3 font-medium">নাম</th>
              <th className="px-4 py-3 font-medium">ইমেইল</th>
              <th className="px-4 py-3 font-medium">Guardian</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">Loading...</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                  Data load করা যায়নি। Backend চলছে কিনা check করুন।
                </td>
              </tr>
            )}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">এখনো কোনো student নেই।</td>
              </tr>
            )}
            {data?.map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs text-ink/70">{s.studentId}</td>
                <td className="px-4 py-3">{s.user?.fullName}</td>
                <td className="px-4 py-3 text-ink/60">{s.user?.email}</td>
                <td className="px-4 py-3 text-ink/60">{s.guardianName || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-teal-50 text-teal-700 text-xs px-2.5 py-1 capitalize">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
