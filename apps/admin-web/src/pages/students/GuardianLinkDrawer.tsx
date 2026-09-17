import { useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import { useGuardians } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDebounced } from '../../hooks/useDebounced';
import { relationLabel } from '../../lib/format';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Field, FormSection, Input, Select } from '../../components/ui/Field';
import type { Guardian, GuardianRelation, Student } from '../../types';

const RELATIONS = Object.keys(relationLabel) as GuardianRelation[];
const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Link the student to an existing guardian, a new one, or none. */
export function GuardianLinkDrawer({ student, onClose }: { student: Student; onClose: () => void }) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const guardians = useGuardians(useDebounced(search.trim()));
  const [selectedId, setSelectedId] = useState<string | null>(student.guardianId);
  const [relation, setRelation] = useState<GuardianRelation | ''>(student.guardianRelation ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const newErrors = {
    name: !name.trim() ? 'নাম দিন' : undefined,
    phone: phone && !PHONE.test(phone.trim()) ? 'সঠিক mobile নম্বর দিন (01XXXXXXXXX)' : undefined,
  };

  const save = useApiMutation(
    async () => {
      let guardianId = selectedId;
      if (mode === 'new') {
        const created = await api.post<Guardian>('/guardians', { fullName: name.trim(), phone: phone.trim() || undefined });
        guardianId = created.data.id;
      }
      return api.patch(`/students/${student.id}`, { guardianId, guardianRelation: guardianId && relation ? relation : undefined });
    },
    { invalidate: [['students'], ['guardians']], success: 'Guardian আপডেট হয়েছে', onSuccess: onClose },
  );

  const submit = () => {
    setSubmitted(true);
    if (mode === 'new' && (newErrors.name || newErrors.phone)) return;
    save.mutate();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Guardian"
      description={`${student.user?.fullName}-এর guardian`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button onClick={submit} loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div role="radiogroup" aria-label="Guardian কীভাবে" className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1 border border-border">
          {(['existing', 'new'] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${mode === m ? 'bg-teal-800 text-paper' : 'text-ink/60 hover:bg-paper'}`}
            >
              {m === 'existing' ? 'আগের guardian' : 'নতুন guardian'}
            </button>
          ))}
        </div>

        {mode === 'existing' ? (
          <FormSection title="Guardian বাছাই">
            <label className="relative block">
              <span className="sr-only">নাম বা phone দিয়ে খুঁজুন</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম বা phone" className="pl-9" />
            </label>
            <div role="radiogroup" aria-label="Guardian" className="max-h-72 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
              <label className="flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-paper/60">
                <input type="radio" name="guardian" className="accent-teal-800" checked={selectedId === null} onChange={() => setSelectedId(null)} />
                <span className="text-ink/60">কোনো guardian নেই</span>
              </label>
              {(guardians.data ?? []).map((g) => (
                <label key={g.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-paper/60">
                  <input type="radio" name="guardian" className="accent-teal-800" checked={selectedId === g.id} onChange={() => setSelectedId(g.id)} />
                  <span className="flex-1">
                    <span className="text-ink">{g.fullName}</span>
                    {g.students?.length ? <span className="block text-xs text-ink/50">{g.students.map((s) => s.user?.fullName).join(', ')}</span> : null}
                  </span>
                  <span className="text-xs text-ink/50 tabular-nums">{g.phone}</span>
                </label>
              ))}
            </div>
          </FormSection>
        ) : (
          <FormSection title="নতুন guardian">
            <Field label="নাম" required error={submitted ? newErrors.name : undefined}>
              {(id) => <Input id={id} invalid={submitted && !!newErrors.name} value={name} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <Field label="Mobile" error={submitted ? newErrors.phone : undefined} hint="এই নম্বরে আগে থেকে guardian থাকলে 'আগের guardian' থেকে বাছাই করুন">
              {(id, d) => <Input id={id} inputMode="tel" aria-describedby={d} invalid={submitted && !!newErrors.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />}
            </Field>
          </FormSection>
        )}

        {(mode === 'new' || selectedId) && (
          <Field label="সম্পর্ক">
            {(id) => (
              <Select id={id} value={relation} onChange={(e) => setRelation(e.target.value as GuardianRelation)}>
                <option value="">বাছাই করুন</option>
                {RELATIONS.map((r) => <option key={r} value={r}>{relationLabel[r]}</option>)}
              </Select>
            )}
          </Field>
        )}
      </div>
    </Drawer>
  );
}
