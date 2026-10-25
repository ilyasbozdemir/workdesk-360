import React from 'react'
import { ListFilter, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { ViewToggle } from '../../components/ui/ViewToggle'
import { MalzemeGroupHeader } from './components/MalzemeGroupHeader'
import { MalzemeGridCard } from './components/MalzemeGridCard'
import { MalzemeListCard } from './components/MalzemeListCard'
import { MalzemeTableRow } from './components/MalzemeTableRow'
import { MalzemelerHeader } from './components/MalzemelerHeader'
import { MalzemelerStatsCards } from './components/MalzemelerStatsCards'
import { useMalzemelerScreenLogic } from './useMalzemelerScreenLogic'

export default function MalzemelerScreen(): React.JSX.Element {
  const {
    kalemList,
    isKalemLoading,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    groupMode,
    setGroupMode,
    selectedIds,
    handleToggleSelect,
    handleEdit,
    handleDeleteKalem,
    handleToggleSelectAll,
    handleDeleteSelected,
    filteredList,
    groupedItems
  } = useMalzemelerScreenLogic()

  if (isKalemLoading) {
    return <div className="p-8 text-slate-500">Yükleniyor...</div>
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <MalzemelerHeader
        totalCount={kalemList.length}
        selectedCount={selectedIds.length}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* STATS CARDS */}
      <MalzemelerStatsCards
        kalemList={kalemList}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* MAIN CONTAINER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
        {/* TABS, VIEW MODE & SEARCH */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg overflow-x-auto max-w-full">
            {['Tümü', 'Mal', 'Hizmet', 'Yapım'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {tab === 'Mal'
                  ? 'Mal Alımı'
                  : tab === 'Hizmet'
                    ? 'Hizmet Alımı'
                    : tab === 'Yapım'
                      ? 'Yapım İşi'
                      : tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-450 cursor-pointer hover:text-slate-850 dark:hover:text-slate-100 shrink-0">
              <input
                type="checkbox"
                checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedIds.length > 0 && selectedIds.length < filteredList.length
                  }
                }}
                onChange={handleToggleSelectAll}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-905 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Tümünü Seç ({selectedIds.length})
            </label>

            <select
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as 'none' | 'tasinir' | 'okas')}
              className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-300 w-full sm:w-auto"
            >
              <option value="none">Gruplama Yok</option>
              <option value="tasinir">Taşınır Koduna Göre Grupla</option>
              <option value="okas">OKAS Koduna Göre Grupla</option>
            </select>

            <ViewToggle
              viewMode={viewMode}
              onChange={setViewMode}
              className="w-full sm:w-auto justify-center sm:justify-start"
            />

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ad, Barkod veya Taşınır Kodu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* LIST / GRID / TABLE */}
        <div className="flex-1 overflow-auto p-4">
          {filteredList.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-450 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <ListFilter className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Kayıt Bulunamadı
              </h3>
              <p className="text-xs mt-1 text-slate-500">
                Arama veya filtreleme kriterlerine uygun kayıt bulunmuyor.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedItems).map(([groupName, items]) => (
                <div key={groupName} className="flex flex-col gap-3">
                  <MalzemeGroupHeader
                    groupMode={groupMode}
                    groupName={groupName}
                    itemCount={items.length}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <MalzemeGridCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.includes(item.id)}
                        onToggleSelect={handleToggleSelect}
                        onEdit={handleEdit}
                        onDelete={handleDeleteKalem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedItems).map(([groupName, items]) => (
                <div key={groupName} className="flex flex-col gap-3">
                  <MalzemeGroupHeader
                    groupMode={groupMode}
                    groupName={groupName}
                    itemCount={items.length}
                  />
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <MalzemeListCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.includes(item.id)}
                        onToggleSelect={handleToggleSelect}
                        onEdit={handleEdit}
                        onDelete={handleDeleteKalem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredList.length > 0 && selectedIds.length === filteredList.length
                        }
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedIds.length > 0 && selectedIds.length < filteredList.length
                          }
                        }}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">ID / Barkod</th>
                    <th className="px-4 py-3 whitespace-nowrap">Taşınır / OKAS</th>
                    <th className="px-4 py-3">Kalem Adı</th>
                    <th className="px-4 py-3 whitespace-nowrap">Tipi</th>
                    <th className="px-4 py-3 whitespace-nowrap">Birim</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {Object.entries(groupedItems).map(([groupName, items]) => (
                    <React.Fragment key={groupName}>
                      <MalzemeGroupHeader
                        groupMode={groupMode}
                        groupName={groupName}
                        itemCount={items.length}
                        isTableRow
                      />
                      {items.map((item) => (
                        <MalzemeTableRow
                          key={item.id}
                          item={item}
                          isSelected={selectedIds.includes(item.id)}
                          onToggleSelect={handleToggleSelect}
                          onEdit={handleEdit}
                          onDelete={handleDeleteKalem}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
