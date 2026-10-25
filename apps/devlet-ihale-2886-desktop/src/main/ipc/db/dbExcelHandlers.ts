import { registerKalemExcelHandlers } from './kalemExcelHandlers'
import { registerTasinirOkasHandlers } from './tasinirOkasHandlers'
import { registerTableExcelHandlers } from './tableExcelHandlers'

/**
 * <summary>
 * Veritabanı Excel Dışa/İçe Aktarma ve Şablon IPC İşleyicileri
 * </summary>
 * <description>
 * Kalem, Taşınır Kodu, OKAS Kodu ve Genel Tablo verilerinin Excel şablonlarını üretme,
 * dışa aktarma ve akıllı sütun eşleştirmeli içe aktarma işlemlerini alt modüller üzerinden yürütür.
 * </description>
 */
export function registerDbExcelHandlers(): void {
  registerKalemExcelHandlers()
  registerTasinirOkasHandlers()
  registerTableExcelHandlers()
}
