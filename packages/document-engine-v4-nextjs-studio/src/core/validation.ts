import type { FieldDefinition, FieldValueType } from './types.js';

export function matchesType(type: FieldValueType, value: unknown): boolean {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'boolean': return typeof value === 'boolean';
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
  }
}

export function validateValue(field: FieldDefinition, value: unknown): void {
  if (value === undefined || value === null) {
    if (field.required) throw new Error(`Required: ${field.path}`);
    if (field.mapping.kind === 'collection') throw new Error(`Invalid collection value: ${field.path}`);
    return;
  }
  if (field.required && value === '') throw new Error(`Required: ${field.path}`);
  if (field.mapping.kind === 'collection') {
    if (!Array.isArray(value) || value.some(row => row === null || typeof row !== 'object' || Array.isArray(row))) {
      throw new Error(`Invalid collection value: ${field.path}`);
    }
    const columns = Object.keys(field.mapping.fields);
    for (const [index, row] of value.entries()) {
      for (const col of columns) {
        if (!Object.prototype.hasOwnProperty.call(row, col)) throw new Error(`Missing collection field: ${field.path}[${index}].${col}`);
        const expected = field.collectionFieldTypes?.[col];
        if (expected && (row as Record<string, unknown>)[col] != null && !matchesType(expected, (row as Record<string, unknown>)[col])) {
          throw new Error(`Invalid collection field: ${field.path}[${index}].${col} (${expected})`);
        }
      }
    }
  }
  if (field.valueType && !matchesType(field.valueType, value)) throw new Error(`Invalid ${field.valueType} value: ${field.path}`);
}
