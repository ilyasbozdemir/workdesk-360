import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { Money } from "./money";

describe("Money x decimal.js entegrasyonu", () => {
  it("fromDecimal: hesaplanmış değeri kuruşa yuvarlar (yarı yukarı)", () => {
    expect(Money.fromDecimal(new Decimal("1550").times("2.5")).toTLString())
      .toBe("3.875,00 TL");
    expect(Money.fromDecimal("0.005").kurus).toBe(1n); // 0,5 kuruş -> 1
    expect(Money.fromDecimal("0.004").kurus).toBe(0n);
    expect(Money.fromDecimal("-0.005").kurus).toBe(-1n); // sıfırdan uzağa
  });

  it("fromDecimal 'asagi': gerçek floor (negatifte de)", () => {
    expect(Money.fromDecimal("0.019", "asagi").kurus).toBe(1n);
    expect(Money.fromDecimal("-0.011", "asagi").kurus).toBe(-2n);
  });

  it("number girişindeki float gürültüsünü temizler", () => {
    expect(Money.fromDecimal(0.1 + 0.2).kurus).toBe(30n); // 0.30000000000000004
    expect(() => Money.fromTL(0.1 + 0.2)).toThrow(RangeError); // fromTL bilinçli olarak reddeder
  });

  it("toDecimal <-> fromDecimal gidiş-dönüş kayıpsız", () => {
    for (
      const s of [
        "0.00",
        "0.01",
        "1550.25",
        "180958.00",
        "9999999999.99",
        "-42.50",
      ]
    ) {
      const m = Money.fromTL(s);
      expect(Money.fromDecimal(m.toDecimal()).equals(m)).toBe(true);
      expect(m.toDecimal().toFixed(2)).toBe(Number(s).toFixed(2));
    }
  });

  it("mulDecimal: ondalıklı miktar ve oran", () => {
    expect(Money.fromTL("1550").mulDecimal("2.5").toTLString()).toBe(
      "3.875,00 TL",
    );
    expect(Money.fromTL("0.01").mulDecimal("0.5").kurus).toBe(1n); // 0,5 kuruş -> 1
    // karar pulu regresyonu: 150.798,33 x binde 5,69 = 858,04
    expect(Money.fromTL("150798.33").mulDecimal("0.00569").toTLString()).toBe(
      "858,04 TL",
    );
  });

  it("mulDecimal, mulRate ile aynı sonucu verir (özellik testi)", () => {
    let seed = 12345;
    const rnd = () =>
      (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 500; i++) {
      const m = Money.fromKurus(Math.floor(rnd() * 1e12) - 5e11);
      const pay = 1 + Math.floor(rnd() * 99999);
      const payda = 100000;
      for (const kip of ["yariYukari", "asagi"] as const) {
        expect(m.mulDecimal(new Decimal(pay).div(payda), kip).kurus).toBe(
          m.mulRate(pay, payda, kip).kurus,
        );
      }
    }
  });

  it("büyük tutarlarda hassasiyet kaybı yok", () => {
    const m = Money.fromTL("9999999999999.99"); // 10 trilyon TL
    expect(m.mulDecimal("1.00000001").kurus).toBe(
      m.mulRate(100000001, 100000000).kurus,
    );
  });

  it("geçersiz girişi reddeder", () => {
    expect(() => Money.fromDecimal(Infinity)).toThrow(RangeError);
    expect(() => Money.fromDecimal("abc")).toThrow();
    expect(() => Money.fromTL("1").mulDecimal(NaN)).toThrow(RangeError);
  });

  it("genel Decimal ayarlarını değiştirmez", () => {
    const before = Decimal.precision;
    Money.fromTL("1").mulDecimal("1.5");
    expect(Decimal.precision).toBe(before);
  });
});
