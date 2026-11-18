import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NativeMenuBar } from "../header/NativeMenuBar";
import { HeaderBottomRow } from "../header/HeaderBottomRow";
import { HeaderMenu } from "../header/header.types";

describe("Header & NativeMenuBar — Menü Katman (z-index) ve Örtüşme Testleri", () => {
  const mockMenus: HeaderMenu[] = [
    {
      name: "Dosya",
      items: [
        { label: "Yeni Dosya Aç", onClick: () => {} },
        { label: "Kaydet", onClick: () => {} },
      ],
    },
    {
      name: "Mevzuat & Limitler",
      items: [
        { label: "Doğrudan Temin Parasal Limitleri", onClick: () => {} },
        { label: "TÜİK Yİ-ÜFE Endeksleri", onClick: () => {} },
      ],
    },
  ];

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('1. NativeMenuBar üzerinde "Mevzuat & Limitler" menüsü tıklandığında açılır dropdown listesi görünür', () => {
    render(
      <NativeMenuBar
        visibleMenus={mockMenus}
        overflowMenus={[]}
        isDt={true}
      />,
    );

    const mevzuatBtn = screen.getByText("Mevzuat & Limitler");
    expect(mevzuatBtn).toBeTruthy();

    // Menüyü aç
    fireEvent.click(mevzuatBtn);

    expect(screen.getByText("Doğrudan Temin Parasal Limitleri")).toBeTruthy();
    expect(screen.getByText("TÜİK Yİ-ÜFE Endeksleri")).toBeTruthy();
  });

  it("2. HeaderBottomRow üst menülerin altında kalması için z-20 katmanında yer alır", () => {
    const { container } = render(
      <HeaderBottomRow
        isDt={true}
        procurementMode="dogrudan_temin"
      />,
      { wrapper: createWrapper() },
    );

    const bottomRow = container.querySelector(".relative.z-20");
    expect(bottomRow).toBeTruthy();
    // Kesinlikle z-[100] olmamalı, aksi halde üst satırdaki menülerin üzerine biner
    expect(container.querySelector(".z-\\[100\\]")).toBeNull();
  });
});
