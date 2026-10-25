import React from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { NotKarti } from './components/NotKarti'
import { NotModal } from './components/NotModal'
import { NotlarHeader } from './components/NotlarHeader'
import { NotlarStatsCards } from './components/NotlarStatsCards'
import { NotlarQuickAddBar } from './components/NotlarQuickAddBar'
import { NotlarFilterBar } from './components/NotlarFilterBar'
import { useNotlarScreenLogic } from './useNotlarScreenLogic'

export default function NotlarVeGorevlerScreen(): React.JSX.Element {
  const {
    notlar,
    isLoadingNotlar,
    dosyalar,
    refetchNotlar,
    createNot,
    toggleNot,
    togglePin,
    updateNot,
    deleteNot,
    activeDosyaId,
    search,
    setSearch,
    tab,
    setTab,
    selectedOncelik,
    setSelectedOncelik,
    selectedKategori,
    setSelectedKategori,
    selectedDosya,
    setSelectedDosya,
    viewMode,
    setViewMode,
    quickTitle,
    setQuickTitle,
    quickTip,
    setQuickTip,
    quickOncelik,
    setQuickOncelik,
    isQuickSubmitting,
    handleQuickAdd,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    setEditingItem,
    stats,
    filteredNotlar
  } = useNotlarScreenLogic()

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 overflow-y-auto">
      {/* ÜST BAŞLIK ALANI */}
      <NotlarHeader
        pendingCount={stats.pending}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => refetchNotlar()}
        onAddNew={() => {
          setEditingItem(null)
          setIsModalOpen(true)
        }}
      />

      {/* İÇERİK KONTEYNERİ */}
      <div className="w-full p-6 space-y-6">
        {/* 1. İSTATİSTİK KARTLARI */}
        <NotlarStatsCards stats={stats} />

        {/* 2. HIZLI GÖREV / NOT EKLEME ÇUBUĞU */}
        <NotlarQuickAddBar
          quickTitle={quickTitle}
          onQuickTitleChange={setQuickTitle}
          quickTip={quickTip}
          onQuickTipChange={setQuickTip}
          quickOncelik={quickOncelik}
          onQuickOncelikChange={setQuickOncelik}
          isSubmitting={isQuickSubmitting}
          onSubmit={handleQuickAdd}
        />

        {/* 3. FİLTRE VE ARAMA ÇUBUĞU */}
        <NotlarFilterBar
          tab={tab}
          onTabChange={setTab}
          stats={stats}
          search={search}
          onSearchChange={setSearch}
          activeDosyaId={activeDosyaId}
          selectedDosya={selectedDosya}
          onSelectedDosyaChange={setSelectedDosya}
          dosyalar={dosyalar}
          selectedOncelik={selectedOncelik}
          onSelectedOncelikChange={setSelectedOncelik}
          selectedKategori={selectedKategori}
          onSelectedKategoriChange={setSelectedKategori}
        />

        {/* 4. NOTLAR VE GÖREVLER LİSTESİ / IZGARASI */}
        {isLoadingNotlar ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Notlar ve görevler yükleniyor...</p>
          </div>
        ) : filteredNotlar.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Henüz kayıt bulunmuyor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Filtre kriterlerinize uygun not veya görev bulunamadı. Yeni bir görev ekleyerek
              başlayabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Notunuzu Ekleyin</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2.5">
            {filteredNotlar.map((item) => (
              <NotKarti
                key={item.id}
                item={item}
                viewMode="list"
                onToggle={(id, currentStatus) => toggleNot({ id, tamamlandi: !currentStatus })}
                onTogglePin={(id, currentPin) => togglePin({ id, sabitlendi: !currentPin })}
                onEdit={(item) => {
                  setEditingItem(item)
                  setIsModalOpen(true)
                }}
                onDelete={(id) => {
                  if (confirm('Bu notu/görevi silmek istediğinize emin misiniz?')) {
                    deleteNot(id)
                  }
                }}
                onSelectDosya={(dosyaId) => setSelectedDosya(dosyaId)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotlar.map((item) => (
              <NotKarti
                key={item.id}
                item={item}
                viewMode="sticky"
                onToggle={(id, currentStatus) => toggleNot({ id, tamamlandi: !currentStatus })}
                onTogglePin={(id, currentPin) => togglePin({ id, sabitlendi: !currentPin })}
                onEdit={(item) => {
                  setEditingItem(item)
                  setIsModalOpen(true)
                }}
                onDelete={(id) => {
                  if (confirm('Bu notu/görevi silmek istediğinize emin misiniz?')) {
                    deleteNot(id)
                  }
                }}
                onSelectDosya={(dosyaId) => setSelectedDosya(dosyaId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* DETAYLI EKLE / DÜZENLE MODALI */}
      <NotModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        dosyalar={dosyalar}
        defaultDosyaId={
          typeof selectedDosya === 'number'
            ? selectedDosya
            : selectedDosya === 'general'
              ? null
              : activeDosyaId || null
        }
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          if (editingItem) {
            await updateNot(data)
          } else {
            await createNot(data)
          }
        }}
      />
    </div>
  )
}
