import type { FormField } from "../core/types.js";
import { getAt } from "../core/path.js";
export function DynamicTemplate({fields, data}: {fields: readonly FormField[]; data: Record<string, unknown>}) {
  return <article>{fields.map(f => {
    const value = getAt(data, f.path);
    return <section key={f.path}><strong>{f.label}</strong>{f.kind === "table" && Array.isArray(value)
      ? <table><tbody>{value.map((row,i)=><tr key={i}>{Object.values(row as Record<string, unknown>).map((v,j)=><td key={j}>{String(v ?? "")}</td>)}</tr>)}</tbody></table>
      : <p>{String(value ?? "")}</p>}</section>;
  })}</article>;
}
