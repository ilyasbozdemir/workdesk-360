import type { FormField } from '../core/types.js';
import { getAt } from '../core/path.js';
import { useState } from 'react';

/** Controlled overrides are submitted to SnapshotEngine.buildAndSave, never directly to SQLite. */
export function DynamicForm({ fields, data, onSave }: {
  fields: readonly FormField[];
  data: Record<string, unknown>;
  onSave: (overrides: Record<string, unknown>, clearOverrides: readonly string[]) => void;
}) {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [cleared, setCleared] = useState<string[]>([]);
  const update = (path: string, value: unknown) => {
    setEdits(current => ({ ...current, [path]: value }));
    setCleared(current => current.filter(item => item !== path));
  };
  return <form onSubmit={event => { event.preventDefault(); onSave(edits, cleared); }}>
    {fields.map(field => {
      const value = Object.prototype.hasOwnProperty.call(edits, field.path) ? edits[field.path] : getAt(data, field.path);
      const editable = field.editable === true && field.kind !== 'table';
      return <div key={field.path}>
        <label htmlFor={`field-${field.path}`}>{field.label}</label>
        {editable ? <>
          <input id={`field-${field.path}`} type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
            value={value == null ? '' : String(value)}
            onChange={event => update(field.path, field.kind === 'number' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value)} />
          {<button type="button" onClick={() => {
            setEdits(current => { const next = { ...current }; delete next[field.path]; return next; });
            setCleared(current => current.includes(field.path) ? current : [...current, field.path]);
          }}>Kaynak değerine dön</button>}
        </> : <output id={`field-${field.path}`}>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}</output>}
      </div>;
    })}
    <button type="submit">Kaydet</button>
  </form>;
}
