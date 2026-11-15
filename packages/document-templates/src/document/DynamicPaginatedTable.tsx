import React from "react";
import { DocumentTable } from "./DocumentTable";

export interface PageLimitConfig {
  firstPage: number;
  middle: number;
  lastPage: number;
}

export const DEFAULT_LIMITS: PageLimitConfig = {
  firstPage: 12,
  middle: 18,
  lastPage: 8,
};

export const LANDSCAPE_LIMITS: PageLimitConfig = {
  firstPage: 6,
  middle: 9,
  lastPage: 4,
};

export interface SignatureAwareLimitOptions {
  orientation?: "portrait" | "landscape";
  hasOlur?: boolean;
  hasHazirlayan?: boolean;
  commissionCount?: number;
  hasExtendedHeader?: boolean;
  customFirstPage?: number | null;
  customMiddlePage?: number | null;
  customLastPage?: number | null;
}

/**
 * İmza Bloğu Koruma Algoritması (Signature-Aware Pagination Engine)
 *
 * Belgedeki imza bloklarının (Harcama Yetkilisi Oluru, Hazırlayan Personel,
 * Komisyon Üyeleri) dikey kapladığı yüksekliğe göre son sayfa satır limitini
 * otomatik olarak ayarlar.
 *
 * Kurallar:
 * 1. OLUR bloğu (~180px) varsa: Son sayfadaki tablo satırı sınırı düşürülür (Dikey: 6, Yatay: 3),
 *    böylece imza bloğu asla sayfadan taşmaz veya tek başına yetim kalmaz.
 * 2. Hem Hazırlayan hem OLUR varsa: Son sayfa 5 satır ile dengelenir.
 * 3. 3-5 üyeli komisyon matrisi varsa: Son sayfa satır sınırı komisyon büyüklüğüne göre ayarlanır.
 * 4. Manuel özel limitler (customFirstPage, customLastPage) girilmişse kullanıcı tercihine öncelik verilir.
 */
export function resolveSignatureAwareLimits(
  options: SignatureAwareLimitOptions = {}
): PageLimitConfig {
  const {
    orientation = "portrait",
    hasOlur = false,
    hasHazirlayan = false,
    commissionCount = 0,
    hasExtendedHeader = false,
    customFirstPage,
    customMiddlePage,
    customLastPage,
  } = options;

  const isLandscape = orientation === "landscape";
  const baseLimits = isLandscape ? LANDSCAPE_LIMITS : DEFAULT_LIMITS;

  let calculatedFirst = baseLimits.firstPage;
  let calculatedMiddle = baseLimits.middle;
  let calculatedLast = baseLimits.lastPage;

  if (hasExtendedHeader) {
    calculatedFirst = Math.max(3, calculatedFirst - 2);
  }

  // İmza bloğu yükseklik payı hesaplaması:
  let signatureDeduction = 0;
  if (hasOlur) signatureDeduction += isLandscape ? 1 : 2;
  if (hasHazirlayan) signatureDeduction += isLandscape ? 0 : 1;
  if (commissionCount >= 5) signatureDeduction += isLandscape ? 1 : 2;
  else if (commissionCount >= 3) signatureDeduction += isLandscape ? 1 : 1;

  calculatedLast = Math.max(isLandscape ? 2 : 3, calculatedLast - signatureDeduction);

  return {
    firstPage:
      customFirstPage !== undefined && customFirstPage !== null
        ? Number(customFirstPage)
        : calculatedFirst,
    middle:
      customMiddlePage !== undefined && customMiddlePage !== null
        ? Number(customMiddlePage)
        : calculatedMiddle,
    lastPage:
      customLastPage !== undefined && customLastPage !== null
        ? Number(customLastPage)
        : calculatedLast,
  };
}

export function paginateData<T>(
  data: T[],
  limits: PageLimitConfig,
  minLastPageRows: number = 2
): T[][] {
  if (data.length === 0) return [[]];

  if (data.length <= limits.lastPage) {
    return [data];
  }

  const pages: T[][] = [];
  let currentIndex = 0;

  let firstPageSize = Math.min(data.length, limits.firstPage);

  if (data.length > limits.lastPage && firstPageSize === data.length) {
    const leaveForNext = Math.min(Math.max(minLastPageRows, 3), limits.lastPage);
    firstPageSize = Math.max(1, data.length - leaveForNext);
  } else if (data.length > limits.firstPage) {
    const remainingAfterFirst = data.length - firstPageSize;
    if (remainingAfterFirst > 0 && remainingAfterFirst < minLastPageRows) {
      const borrow = minLastPageRows - remainingAfterFirst;
      firstPageSize = Math.max(1, firstPageSize - borrow);
    }
  }

  pages.push(data.slice(0, firstPageSize));
  currentIndex += firstPageSize;

  while (currentIndex < data.length) {
    const remainingCount = data.length - currentIndex;

    if (remainingCount <= limits.lastPage) {
      pages.push(data.slice(currentIndex));
      break;
    }

    if (remainingCount <= limits.middle) {
      let lastPageCount = Math.min(Math.ceil(remainingCount / 2), limits.lastPage);
      if (lastPageCount < minLastPageRows && remainingCount >= minLastPageRows) {
        lastPageCount = minLastPageRows;
      }
      const middlePageCount = remainingCount - lastPageCount;

      pages.push(data.slice(currentIndex, currentIndex + middlePageCount));
      pages.push(data.slice(currentIndex + middlePageCount));
      break;
    }

    let middlePageSize = limits.middle;
    const remainingAfterMiddle = remainingCount - middlePageSize;
    if (remainingAfterMiddle > 0 && remainingAfterMiddle < minLastPageRows) {
      const borrow = minLastPageRows - remainingAfterMiddle;
      middlePageSize = Math.max(1, middlePageSize - borrow);
    }

    pages.push(data.slice(currentIndex, currentIndex + middlePageSize));
    currentIndex += middlePageSize;
  }

  return pages;
}
