/* eslint-disable */
// ============================================================
// SCHEMA MANİFEST VERSİYONLARI — KANAL BAZLI DERLEME
// Sürümler alpha, beta ve rc dosyalarında gruplanmıştır.
// ============================================================

import { alphaManifests } from "./manifests.alpha";
import { betaManifests } from "./manifests.beta";
import { rcManifests } from "./manifests.rc";
import currentVersion from "./versions/current.version";

export const manifests: any[] = [
  ...alphaManifests,
  ...betaManifests,
  ...rcManifests,
  currentVersion
];
