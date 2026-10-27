import React, { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  Briefcase,
  FileText,
  History,
  LayoutDashboard,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Building,
  Printer,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import type { PersonelRecord, IzinTalebi, Gorevlendirme, PersonelIslemGecmisi } from '@worksuite-360/contracts'

type TabType = 'dashboard' | 'personel' | 'izin' | 'gorev' | 'belge' | 'audit'

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [personeller, setPersoneller] = useState<PersonelRecord[]>([])
  const [izinler, setIzinler] = useState<IzinTalebi[]>([])
  const [gorevler, setGorevler] = useState<Gorevlendirme[]>([])
  const [auditLogs, setAuditLogs] = useState<PersonelIslemGecmisi[]>([])
  const [birimler, setBirimler] = useState<Array<{ id: string; ad: string; kod: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showPersonelModal, setShowPersonelModal] = useState(false)
  const [showIzinModal, setShowIzinModal] = useState(false)
  const [selectedPersonelForBelge, setSelectedPersonelForBelge] = useState<PersonelRecord | null>(null)
  const [belgeTuru, setBelgeTuru] = useState<'izin_formu' | 'izin_onay' | 'gorevlendirme_oluru'>('izin_formu')

  // Form states
  const [newPersonel, setNewPersonel] = useState({
    tcKimlikNo: '',
    sicilNo: '',
    ad: '',
    soyad: '',
    unvan: '',
    kadro: 'Memur (657)',
    birimAdi: 'İnsan Kaynakları ve Eğitim Müdürlüğü',
    iseBaslamaTarihi: new Date().toISOString().split('T')[0],
    telefon: '',
    eposta: ''
  })

  const [newIzin, setNewIzin] = useState({
    personelId: '',
    izinTuru: 'yillik',
    baslangicTarihi: new Date().toISOString().split('T')[0],
    bitisTarihi: new Date().toISOString().split('T')[0],
    aciklama: 'Yıllık izin talebi'
  })
  const [izinHata, setIzinHata] = useState<string | null>(null)

  const loadData = async (): Promise<void> => {
    try {
      if (window.api) {
        const [pList, iList, gList, aList, bList] = await Promise.all([
          window.api.getPersonelList(),
          window.api.getIzinTalepleri(),
          window.api.getGorevlendirmeler(),
          window.api.getAuditHistory(),
          window.api.getBirimler()
        ])
        setPersoneller(pList || [])
        setIzinler(iList || [])
        setGorevler(gList || [])
        setAuditLogs(aList || [])
        setBirimler(bList || [])
        if (pList && pList.length > 0 && !selectedPersonelForBelge) {
          setSelectedPersonelForBelge(pList[0])
          setNewIzin((prev) => ({ ...prev, personelId: pList[0].id }))
        }
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePersonel = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newPersonel.ad || !newPersonel.soyad || !newPersonel.tcKimlikNo || !newPersonel.sicilNo) return
    const now = new Date().toISOString()
    const record: PersonelRecord = {
      id: `p-${Date.now()}`,
      ...newPersonel,
      calismaDurumu: 'aktif',
      birimId: birimler.find((b) => b.ad === newPersonel.birimAdi)?.id || 'b-1',
      olusturulduguTarih: now,
      guncellendigiTarih: now
    }
    await window.api.createPersonel(record)
    setShowPersonelModal(false)
    setNewPersonel({
      tcKimlikNo: '',
      sicilNo: '',
      ad: '',
      soyad: '',
      unvan: '',
      kadro: 'Memur (657)',
      birimAdi: 'İnsan Kaynakları ve Eğitim Müdürlüğü',
      iseBaslamaTarihi: new Date().toISOString().split('T')[0],
      telefon: '',
      eposta: ''
    })
    await loadData()
  }

  const handleCreateIzin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIzinHata(null)
    const res = await window.api.createIzinTalebi({
      ...newIzin,
      actorName: 'İK Uzmanı'
    })
    if (!res.success) {
      setIzinHata(res.hata || 'İzin talebi oluşturulamadı.')
      return
    }
    setShowIzinModal(false)
    await loadData()
  }

  const handleApproveIzin = async (izinId: string): Promise<void> => {
    await window.api.approveIzinTalebi(izinId, 'Birim Amiri')
    await loadData()
  }

  const filteredPersonel = personeller.filter(
    (p) =>
      p.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sicilNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.birimAdi.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const aktifCount = personeller.filter((p) => p.calismaDurumu === 'aktif').length
  const izinliCount = personeller.filter((p) => p.calismaDurumu === 'izinli').length
  const gorevdeCount = personeller.filter((p) => p.calismaDurumu === 'gorevlendirmede').length
  const bekleyenIzinCount = izinler.filter((i) => i.durum === 'onayda').length

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Personel 360
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-medium border border-emerald-800">
                .EXE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Kurumsal İK & İzin Masası</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Genel Bakış
          </button>

          <button
            onClick={() => setActiveTab('personel')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'personel'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              Personel Listesi
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {personeller.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('izin')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'izin'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4" />
              İzin Yönetimi
            </div>
            {bekleyenIzinCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                {bekleyenIzinCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gorev')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'gorev'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Görevlendirmeler
          </button>

          <button
            onClick={() => setActiveTab('belge')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'belge'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Matbu Belgeler
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Denetim Kayıtları
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SQLite Güvenli WAL</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v1.0.0-beta</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/40 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize">
              {activeTab === 'dashboard' && 'Kurumsal İnsan Kaynakları Paneli'}
              {activeTab === 'personel' && 'Personel Bilgi ve Kadro Havuzu'}
              {activeTab === 'izin' && 'Personel İzin Başvuruları ve Onay Süreci'}
              {activeTab === 'gorev' && 'Kurum İçi ve Geçici Görevlendirmeler'}
              {activeTab === 'belge' && 'Resmi İK Matbu Evrak ve Onay Belgeleri'}
              {activeTab === 'audit' && 'Denetlenebilir Sistem İşlem Geçmişi'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Personel veya sicil ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-52"
              />
            </div>
            {activeTab === 'personel' && (
              <button
                onClick={() => setShowPersonelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Personel Ekle
              </button>
            )}
            {activeTab === 'izin' && (
              <button
                onClick={() => setShowIzinModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni İzin Talebi
              </button>
            )}
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Toplam Personel</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{personeller.length}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> {aktifCount} Aktif Görevde
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>İzindeki Personel</span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{izinliCount}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Yıllık veya Mazeret İzninde</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Bekleyen Onaylar</span>
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{bekleyenIzinCount}</div>
                  <div className="text-[11px] text-blue-400 mt-1">Amir Kararı Bekliyor</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Görevlendirmeler</span>
                    <Briefcase className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{gorevdeCount}</div>
                  <div className="text-[11px] text-purple-400 mt-1">Geçici veya Saha Görevinde</div>
                </div>
              </div>

              {/* Quick Actions & Recent Leaves */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Son İzin Talepleri & Durum
                  </h3>
                  <div className="space-y-2">
                    {izinler.slice(0, 5).map((iz) => (
                      <div
                        key={iz.id}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{iz.personelAdSoyad}</div>
                          <div className="text-[11px] text-slate-400">
                            {iz.baslangicTarihi} - {iz.bitisTarihi} ({iz.gunSayisi} gün, {iz.izinTuru})
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            iz.durum === 'onaylandi'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {iz.durum.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {izinler.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Henüz izin talebi bulunmamaktadır.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    Son İşlem Hareketleri (Audit Log)
                  </h3>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{log.yapanKullaniciAdi}</span>
                          <span>{new Date(log.tarih).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="font-medium text-slate-200">{log.aciklama}</div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Kayıtlı işlem geçmişi yok.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONEL LISTESI */}
          {activeTab === 'personel' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Adı Soyadı</th>
                      <th className="p-3">Sicil / TC Kimlik</th>
                      <th className="p-3">Birim</th>
                      <th className="p-3">Unvan / Kadro</th>
                      <th className="p-3">İşe Başlama</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPersonel.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-white">
                          {p.ad} {p.soyad}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {p.sicilNo} <span className="text-[10px] text-slate-400">({p.tcKimlikNo})</span>
                        </td>
                        <td className="p-3 text-slate-300 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {p.birimAdi}
                        </td>
                        <td className="p-3 text-slate-300">
                          {p.unvan} <span className="text-[10px] text-slate-400">({p.kadro})</span>
                        </td>
                        <td className="p-3 text-slate-400">{p.iseBaslamaTarihi}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.calismaDurumu === 'aktif'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : p.calismaDurumu === 'izinli'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-purple-950 text-purple-400 border border-purple-800'
                            }`}
                          >
                            {p.calismaDurumu.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPersonelForBelge(p)
                              setActiveTab('belge')
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors"
                          >
                            Evrak Hazırla
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPersonel.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          Arama kriterlerine uygun personel kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: IZIN YONETIMI */}
          {activeTab === 'izin' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Personel</th>
                      <th className="p-3">İzin Türü</th>
                      <th className="p-3">Tarih Aralığı</th>
                      <th className="p-3">Süre</th>
                      <th className="p-3">Gerekçe / Açıklama</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-right">Amir Onayı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {izinler.map((iz) => (
                      <tr key={iz.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-white">
                          {iz.personelAdSoyad}
                          <div className="text-[10px] text-slate-400 font-mono">{iz.sicilNo}</div>
                        </td>
                        <td className="p-3 capitalize text-slate-300">{iz.izinTuru} İzni</td>
                        <td className="p-3 text-slate-300 font-mono">
                          {iz.baslangicTarihi} → {iz.bitisTarihi}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{iz.gunSayisi} Gün</td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{iz.aciklama}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              iz.durum === 'onaylandi'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {iz.durum.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {iz.durum === 'onayda' && (
                            <button
                              onClick={() => handleApproveIzin(iz.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Onayla
                            </button>
                          )}
                          {iz.durum === 'onaylandi' && (
                            <span className="text-[11px] text-emerald-400 font-medium">✓ Onaylandı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {izinler.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          Kayıtlı izin talebi bulunmamaktadır.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GOREVLENDIRMELER */}
          {activeTab === 'gorev' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Personel ID</th>
                    <th className="p-3">Görev Türü</th>
                    <th className="p-3">Görev Tanımı</th>
                    <th className="p-3">Görevlendirilen Birim</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gorevler.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono text-slate-300">{g.personelId}</td>
                      <td className="p-3 font-semibold text-white capitalize">{g.gorevTuru.replace('_', ' ')}</td>
                      <td className="p-3 text-slate-300">{g.gorevTanimi}</td>
                      <td className="p-3 text-slate-400">{g.gorevlendirilenBirimAdi || 'Merkez Teşkilatı'}</td>
                      <td className="p-3 text-slate-400">{g.baslangicTarihi}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
                          {g.durum.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {gorevler.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        Aktif görevlendirme kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: MATBU BELGELER */}
          {activeTab === 'belge' && (
            <div className="grid grid-cols-3 gap-6">
              {/* Belge Seçim Paneli */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Belge Parametreleri</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Personel Seçimi</label>
                    <select
                      value={selectedPersonelForBelge?.id || ''}
                      onChange={(e) => {
                        const found = personeller.find((p) => p.id === e.target.value)
                        setSelectedPersonelForBelge(found || null)
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      {personeller.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.ad} {p.soyad} ({p.sicilNo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Şablon Türü</label>
                    <select
                      value={belgeTuru}
                      onChange={(e) => setBelgeTuru(e.target.value as any)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="izin_formu">Standart İzin Talep Formu</option>
                      <option value="izin_onay">Makam İzin Onay Belgesi</option>
                      <option value="gorevlendirme_oluru">Kurum İçi Görevlendirme Oluru</option>
                    </select>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Belgeyi Yazdır (A4)
                  </button>
                </div>
              </div>

              {/* Matbu A4 Önizleme */}
              <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-8 flex justify-center overflow-y-auto max-h-[700px]">
                <div className="w-[595px] min-h-[720px] bg-white text-slate-900 p-10 shadow-2xl rounded font-serif text-[13px] leading-relaxed flex flex-col justify-between">
                  <div>
                    <div className="text-center font-bold tracking-wide leading-tight mb-8">
                      <div className="text-[14px]">T.C.</div>
                      <div className="text-[15px] uppercase">ÇANKAYA BELEDİYE BAŞKANLIĞI</div>
                      <div className="text-[12px] font-sans font-normal mt-0.5">
                        {selectedPersonelForBelge?.birimAdi || 'İnsan Kaynakları ve Eğitim Müdürlüğü'}
                      </div>
                    </div>

                    <div className="text-center font-bold text-[14px] uppercase border-b-2 border-slate-900 pb-2 mb-6">
                      {belgeTuru === 'izin_formu' && 'PERSONEL İZİN TALEP FORMU'}
                      {belgeTuru === 'izin_onay' && 'PERSONEL İZİN ONAY BELGESİ'}
                      {belgeTuru === 'gorevlendirme_oluru' && 'GÖREVLENDİRME OLURU (BAŞKANLIK MAKAMINA)'}
                    </div>

                    <div className="space-y-4 text-justify">
                      <p>
                        Müdürlüğümüz emrinde <strong>{selectedPersonelForBelge?.unvan || 'Memur'}</strong> unvanıyla görev yapan{' '}
                        <strong>
                          {selectedPersonelForBelge?.ad} {selectedPersonelForBelge?.soyad}
                        </strong>{' '}
                        (Sicil No: <strong>{selectedPersonelForBelge?.sicilNo}</strong>), 657 Sayılı Devlet Memurları Kanunu
                        kapsamında belirtilen hakkı doğrultusunda izin talep etmektedir.
                      </p>

                      <div className="border border-slate-400 p-3 rounded font-sans text-xs space-y-1 bg-slate-50">
                        <div>
                          <strong>T.C. Kimlik No:</strong> {selectedPersonelForBelge?.tcKimlikNo}
                        </div>
                        <div>
                          <strong>Kadro Statüsü:</strong> {selectedPersonelForBelge?.kadro}
                        </div>
                        <div>
                          <strong>İşe Başlama Tarihi:</strong> {selectedPersonelForBelge?.iseBaslamaTarihi}
                        </div>
                        <div>
                          <strong>İzinli Olacağı Dönem:</strong> 2026 Yılı Yıllık İzin (14 Gün)
                        </div>
                      </div>

                      <p>
                        Gereğini ve tensiplerinizi arz ederim.
                      </p>
                    </div>
                  </div>

                  {/* İmza Blokları */}
                  <div className="pt-12 border-t border-slate-300 grid grid-cols-2 text-center text-xs font-sans">
                    <div>
                      <div className="font-bold">Talep Eden Personel</div>
                      <div className="mt-8">
                        {selectedPersonelForBelge?.ad} {selectedPersonelForBelge?.soyad}
                      </div>
                      <div className="text-slate-500 text-[11px]">(İmza)</div>
                    </div>
                    <div>
                      <div className="font-bold">Birim Amiri (Onay)</div>
                      <div className="mt-8">Ali Rıza ÖZTÜRK</div>
                      <div className="text-slate-500 text-[11px]">Şube Müdürü</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Kullanıcı</th>
                    <th className="p-3">İşlem Türü</th>
                    <th className="p-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-slate-400">{new Date(log.tarih).toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-emerald-400 font-bold">{log.yapanKullaniciAdi}</td>
                      <td className="p-3 text-slate-300 uppercase">{log.islemTuru}</td>
                      <td className="p-3 text-slate-200">{log.aciklama}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        Kayıtlı denetim hareketi bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: YENİ PERSONEL */}
      {showPersonelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Yeni Personel Kaydı Ekle</h3>
            <form onSubmit={handleCreatePersonel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Adı</label>
                  <input
                    required
                    type="text"
                    value={newPersonel.ad}
                    onChange={(e) => setNewPersonel({ ...newPersonel, ad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Soyadı</label>
                  <input
                    required
                    type="text"
                    value={newPersonel.soyad}
                    onChange={(e) => setNewPersonel({ ...newPersonel, soyad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">T.C. Kimlik No</label>
                  <input
                    required
                    maxLength={11}
                    type="text"
                    value={newPersonel.tcKimlikNo}
                    onChange={(e) => setNewPersonel({ ...newPersonel, tcKimlikNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sicil Numarası</label>
                  <input
                    required
                    type="text"
                    value={newPersonel.sicilNo}
                    onChange={(e) => setNewPersonel({ ...newPersonel, sicilNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Unvan</label>
                <input
                  required
                  type="text"
                  placeholder="örn: Uzman / Mühendis / VHKİ"
                  value={newPersonel.unvan}
                  onChange={(e) => setNewPersonel({ ...newPersonel, unvan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bağlı Olduğu Birim</label>
                <select
                  value={newPersonel.birimAdi}
                  onChange={(e) => setNewPersonel({ ...newPersonel, birimAdi: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  {birimler.map((b) => (
                    <option key={b.id} value={b.ad}>
                      {b.ad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPersonelModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: YENİ İZİN TALEBİ */}
      {showIzinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Yeni İzin Talebi Aç</h3>
            {izinHata && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{izinHata}</span>
              </div>
            )}
            <form onSubmit={handleCreateIzin} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Personel</label>
                <select
                  value={newIzin.personelId}
                  onChange={(e) => setNewIzin({ ...newIzin, personelId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  {personeller.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ad} {p.soyad} ({p.sicilNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">İzin Türü</label>
                <select
                  value={newIzin.izinTuru}
                  onChange={(e) => setNewIzin({ ...newIzin, izinTuru: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="yillik">Yıllık İzin (657 / 4/B)</option>
                  <option value="mazeret">Mazeret İzni</option>
                  <option value="hastalik">Hastalık / Rapor</option>
                  <option value="evlilik">Evlilik İzni</option>
                  <option value="babalik">Babalık İzni</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    value={newIzin.baslangicTarihi}
                    onChange={(e) => setNewIzin({ ...newIzin, baslangicTarihi: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    required
                    value={newIzin.bitisTarihi}
                    onChange={(e) => setNewIzin({ ...newIzin, bitisTarihi: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Gerekçe</label>
                <textarea
                  rows={2}
                  value={newIzin.aciklama}
                  onChange={(e) => setNewIzin({ ...newIzin, aciklama: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIzinModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
                >
                  Onaya Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
