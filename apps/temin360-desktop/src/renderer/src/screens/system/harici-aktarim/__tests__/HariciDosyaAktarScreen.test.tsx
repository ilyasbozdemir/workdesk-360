import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HariciDosyaAktarScreen from "../HariciDosyaAktarScreen";
import * as hariciService from "../hariciAktarimService";
import { APP_ROUTES } from "../../../../constants/routeConstants";
import type { ExistingDossierSummary, SyncResult } from "../types";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const sampleDossiers: ExistingDossierSummary[] = [
  {
    id: 101,
    temin_no: "2025/2",
    ekap_no: undefined,
    konu: "Mevcut Su Sayacı Alımı",
    butce_yili: 2025,
    durum_asama_id: 1,
  },
  {
    id: 102,
    temin_no: "2025/5",
    ekap_no: undefined,
    konu: "Kırtasiye Alımı",
    butce_yili: 2025,
    durum_asama_id: 2,
  },
];

describe("HariciDosyaAktarScreen UI Entegrasyon & Uçtan Uca Akış Testleri", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(hariciService, "fetchExistingDossiers").mockResolvedValue(
      sampleDossiers,
    );
  });

  it("ilk açılışta boş durum mesajını ve JSON bekleniyor uyarısını görüntüler", async () => {
    render(<HariciDosyaAktarScreen />);

    expect(screen.getByText("JSON Verisi Bekleniyor")).toBeTruthy();
    expect(screen.getByText(/Gelen JSON Verisi \(Doğrudan Temin Şeması\)/i))
      .toBeTruthy();
  });

  it("Örnek JSON butonuna tıklandığında veriyi doğrular ve önizleme sekmelerini doldurur", async () => {
    render(<HariciDosyaAktarScreen />);

    const fillBtn = screen.getByRole("button", {
      name: /Örnek JSON'ı Doldur/i,
    });
    fireEvent.click(fillBtn);

    await waitFor(() => {
      expect(screen.getByText(/JSON Doğrulandı:/i)).toBeTruthy();
    });

    // Dosya bilgileri
    expect(screen.getAllByText(/Su Sayacı Alımı/i).length)
      .toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Hedef Dosya Seçimi ve Ezme Stratejisi"))
      .toBeTruthy();

    // Malzemeler sekmesine tıkla
    const matTab = screen.getByRole("button", { name: /Malzemeler/i });
    fireEvent.click(matTab);
    expect(screen.getAllByText(/Ev Tipi Soğuk Su Sayacı/i).length)
      .toBeGreaterThanOrEqual(1);

    // Teklifler sekmesine tıkla
    const tekTab = screen.getByRole("button", { name: /Teklifler/i });
    fireEvent.click(tekTab);
    expect(screen.getAllByText(/Anadolu Sayaç San/i).length)
      .toBeGreaterThanOrEqual(1);

    // Komisyonlar sekmesine tıkla
    const komTab = screen.getByRole("button", { name: /Komisyonlar/i });
    fireEvent.click(komTab);
    expect(screen.getAllByText(/Mehmet MUTLU/i).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("geçersiz JSON metni girildiğinde hata bildirimini görüntüler", async () => {
    const { container } = render(<HariciDosyaAktarScreen />);

    const textarea = container.querySelector("textarea")!;
    fireEvent.change(textarea, { target: { value: "{ gecersiz json " } });

    await waitFor(() => {
      expect(screen.getByText(/JSON ayrıştırma hatası:/i)).toBeTruthy();
    });
  });

  it("Yeni Dosya Olarak Ekle akışı: onay paneli, servis çağrısı ve dosyayı aç butonu", async () => {
    const mockSyncResult: SyncResult = {
      success: true,
      dosyaId: 555,
      isNew: true,
      materialsCount: 3,
      offersCount: 3,
      commissionsCount: 3,
      message: "Yeni doğrudan temin dosyası başarıyla oluşturuldu. (ID: 555)",
      updatedFields: [
        "Genel Bilgiler",
        "Malzeme Kalemleri (3)",
        "Teklifler (3)",
        "Komisyon Heyeti (3)",
      ],
    };

    const executeSpy = vi
      .spyOn(hariciService, "executeDossierEzmeSync")
      .mockResolvedValue(mockSyncResult);

    render(<HariciDosyaAktarScreen />);

    // Örnek JSON'ı doldur
    fireEvent.click(
      screen.getByRole("button", { name: /Örnek JSON'ı Doldur/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/JSON Doğrulandı:/i)).toBeTruthy();
    });

    // "Yeni Dosya Olarak Ekle" radio seçeneğini işaretle
    const newRadio = screen.getByLabelText(/Yeni Dosya Olarak Ekle/i);
    fireEvent.click(newRadio);

    // Ana işlem butonu metninin güncellendiğini doğrula
    const actionBtn = screen.getByRole("button", {
      name: /Verileri Sisteme Yeni Dosya Olarak Ekle/i,
    });
    expect(actionBtn).toBeTruthy();

    // Butona tıkla -> Son onay paneli açılmalı
    fireEvent.click(actionBtn);

    expect(screen.getByText("Yeni Kayıt Onayı")).toBeTruthy();
    expect(screen.getByText(/Yeni doğrudan temin dosyası oluşturulacak:/i))
      .toBeTruthy();

    // Vazgeç testi
    const cancelBtn = screen.getByRole("button", { name: "Vazgeç" });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText("Yeni Kayıt Onayı")).toBeNull();
    expect(executeSpy).not.toHaveBeenCalled();

    // Tekrar butona tıkla ve onayla
    fireEvent.click(
      screen.getByRole("button", {
        name: /Verileri Sisteme Yeni Dosya Olarak Ekle/i,
      }),
    );
    const confirmBtn = screen.getByRole("button", { name: "Onayla ve Uygula" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ id: "dt_2025_2_183260" }),
        expect.objectContaining({
          createNewIfNotFound: true,
          overwriteGeneralInfo: true,
          overwriteMaterials: true,
          overwriteOffers: true,
          overwriteCommissions: true,
        }),
      );
    });

    // Başarı paneli ve dosya aç butonu görünmeli
    await waitFor(() => {
      expect(
        screen.getByText(/Yeni doğrudan temin dosyası başarıyla oluşturuldu/i),
      ).toBeTruthy();
    });

    const openBtn = screen.getByRole("button", {
      name: /Dosyayı Yönetim Ekranında Aç/i,
    });
    fireEvent.click(openBtn);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: APP_ROUTES.DOSYA_MANAGE,
      search: { id: 555 },
    });
  });

  it("Mevcut Dosyayı Ezme akışı: hedef dosya seçimi ve üzerine yazma onay uyarısı", async () => {
    const mockSyncResult: SyncResult = {
      success: true,
      dosyaId: 101,
      isNew: false,
      materialsCount: 3,
      offersCount: 0,
      commissionsCount: 0,
      message: "Mevcut doğrudan temin dosyası başarıyla güncellendi. (ID: 101)",
      updatedFields: ["Genel Bilgiler", "Malzeme Kalemleri (3)"],
    };

    const executeSpy = vi
      .spyOn(hariciService, "executeDossierEzmeSync")
      .mockResolvedValue(mockSyncResult);

    render(<HariciDosyaAktarScreen />);

    fireEvent.click(
      screen.getByRole("button", { name: /Örnek JSON'ı Doldur/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/JSON Doğrulandı:/i)).toBeTruthy();
    });

    // "Mevcut Dosyayı Ez / Güncelle" seçeneği
    const overwriteRadio = screen.getByLabelText(
      /Mevcut Dosyayı Ez \/ Güncelle/i,
    );
    fireEvent.click(overwriteRadio);

    // Ezilecek modüllerden teklifleri kapat
    const offersCheckbox = screen.getByLabelText(/Teklifler & Firmalar/i);
    fireEvent.click(offersCheckbox);

    // Onay panelini aç
    const mainBtn = screen.getByRole("button", {
      name: /Verileri Eşle ve Hedef Dosyayı \(101\) Ez \/ Güncelle/i,
    });
    fireEvent.click(mainBtn);

    expect(screen.getByText("Üzerine Yazma Onayı")).toBeTruthy();
    expect(
      screen.getAllByText(/mevcutlar silinip yeniden yazılacak/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Onayla ve uygula
    fireEvent.click(screen.getByRole("button", { name: "Onayla ve Uygula" }));

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledWith(
        101,
        expect.anything(),
        expect.objectContaining({
          createNewIfNotFound: false,
          overwriteGeneralInfo: true,
          overwriteMaterials: true,
          overwriteOffers: false,
          overwriteCommissions: true,
        }),
      );
    });
  });
});
