import { describe, it, expect } from 'vitest';
import {
  resolveEvrakSayisi,
  formatOfficialEvrakSayisi,
  resolveAntetSatirlari,
  resolveFormula
} from '../resolver/mappingResolver';

describe('Document Templates - mappingResolver Modular Helpers', () => {
  it('resolveEvrakSayisi produces a valid DETSIS formatted code with defaults', async () => {
    const mockExecutor = async (_sql: string, _params: any[]) => [];
    const evrakSayisi = await resolveEvrakSayisi(1, mockExecutor);
    expect(evrakSayisi).toMatch(/^\d{8}-934\.\d{2}-\d{4}$/);
    expect(evrakSayisi).toBe('10234521-934.01-0001');
  });

  it('resolveEvrakSayisi formats custom detsis code and service type', async () => {
    const mockExecutor = async (sql: string, _params: any[]) => {
      if (sql.includes('TANIM_Kurum')) {
        return [{ detsis_kodu: '0000000' }];
      }
      if (sql.includes('DATA_TeminDosyasi') && sql.includes('WHERE id = ?')) {
        return [{ temin_no: '2026/0042', tur: 'hizmet', butce_yili: 2026 }];
      }
      return [];
    };

    const evrakSayisi = await resolveEvrakSayisi(5, mockExecutor);
    expect(evrakSayisi).toBe('0000000-934.02-0042');
  });

  it('resolveAntetSatirlari returns parsed JSON lines when available', async () => {
    const mockExecutor = async (sql: string) => {
      if (sql.includes('TANIM_Kurum')) {
        return [{ kurum_anteti: JSON.stringify(['T.C.', 'ANKARA BÜYÜKŞEHİR BELEDİYESİ']) }];
      }
      return [];
    };

    const antet = await resolveAntetSatirlari(1, mockExecutor);
    expect(antet).toEqual(['T.C.', 'ANKARA BÜYÜKŞEHİR BELEDİYESİ']);
  });

  it('resolveFormula resolves {{table.column}} tokens correctly', async () => {
    const mockExecutor = async (sql: string) => {
      if (sql.includes('TANIM_Kurum')) {
        return [{ detsis_kodu: '99887766' }];
      }
      return [];
    };

    const val = await resolveFormula('{{TANIM_Kurum.detsis_kodu}}', 1, mockExecutor);
    expect(val).toBe('99887766');
  });

  it('formatOfficialEvrakSayisi formats given detsis, sdp and seq numbers', () => {
    const formatted = formatOfficialEvrakSayisi({
      detsisNo: '0000000',
      tur: 'mal',
      sayisi: '1'
    });
    expect(formatted).toBe('0000000-934.01-0001');
  });
});
