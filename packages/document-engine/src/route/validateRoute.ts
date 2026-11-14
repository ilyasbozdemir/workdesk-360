/**
 * ROTA DOĞRULAMASI
 * required alanları boş bıraktırmaz; person-list için dizi bekler;
 * diğer alanlarda tek atama bekler.
 */
import type { ResolvedDocumentRoute, RouteAssignee } from "./types";

export function validateRoute(route: ResolvedDocumentRoute): string[] {
  const errors: string[] = [];
  for (const step of route.steps) {
    if (
      step.required &&
      (step.value === null ||
        (Array.isArray(step.value) && step.value.length === 0))
    ) {
      errors.push(`${step.label}: required`);
    }
    if (step.value === null) continue;
    if (step.kind === "person-list") {
      if (!Array.isArray(step.value)) {
        errors.push(`${step.label}: expected person list`);
      }
    } else if (Array.isArray(step.value)) {
      errors.push(`${step.label}: expected single assignee`);
    } else if (typeof (step.value as RouteAssignee).id !== "string") {
      errors.push(`${step.label}: missing assignee id`);
    }
  }
  return errors;
}

