// document-source.mapping.ts

import { DOCUMENT_FIELDS } from "./document-fields";

export const DOCUMENT_SOURCE_MAPPING = {
  [DOCUMENT_FIELDS.DOSYA.KONU]: {
    source: "DATA_TeminDosyasi",
    column: "dosya_konusu",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.DOSYA.ACILIS_TARIHI]: {
    source: "DATA_TeminDosyasi",
    column: "dosya_acilis_tarihi",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.KURUM.ADI]: {
    source: "TANIM_Kurum",
    column: "kurum_adi",
    scope: "kurumId",
  },
};