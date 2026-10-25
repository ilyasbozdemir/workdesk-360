import React, { useState } from 'react'
import { SubScreen } from '../SubScreen'
import {
  AlertTriangle,
  Database,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X
} from 'lucide-react'
import { useDatabaseBrowser } from './database-browser/useDatabaseBrowser'
import { TableListSidebar } from './database-browser/TableListSidebar'
import { DataTableTab } from './database-browser/DataTableTab'
import { SchemaTab } from './database-browser/SchemaTab'
import { SqlConsoleTab } from './database-browser/SqlConsoleTab'
import { AddRowModal } from './database-browser/AddRowModal'
import { DeleteRowModal } from './database-browser/DeleteRowModal'

export function DatabaseBrowserScreen(): React.JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)

  const {
    selectedTable,
    setSelectedTable,
    tableSearch,
    setTableSearch,
    columns,
    dataSearch,
    setDataSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRows,
    totalPages,
    loading,
    dbError,
    activeTab,
    setActiveTab,
    statusMessage,
    setStatusMessage,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    isAddModalOpen,
    setIsAddModalOpen,
    newRowData,
    setNewRowData,
    deletingRow,
    setDeletingRow,
    consoleQuery,
    setConsoleQuery,
    consoleResults,
    consoleError,
    consoleLoading,
    filteredTables,
    filteredRows,
    loadTables,
    handleCellClick,
    handleSaveCell,
    handleInsertRow,
    handleDeleteRowConfirm,
    handleExportCsv,
    handleRunQuery
  } = useDatabaseBrowser()

  return (
    <SubScreen
      title="SQLite Veritabanı Gezgini & Düzenleyici"
      icon={Database}
      description="Veritabanı tablolarındaki verileri inceleyin, hücre bazında Excel gibi anında güncelleyin veya yeni kayıt ekleyin."
      hideStepper
      requireActiveDosya={false}
    >
      <div className="flex gap-4 h-[calc(100vh-240px)] min-h-125 mt-4 relative font-sans">
        {/* Sidebar: Tables List */}
        <TableListSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
          filteredTables={filteredTables}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          dbError={dbError}
          loading={loading}
          loadTables={loadTables}
        />

        {/* Main Content Area */}
        <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900 transition-all duration-300 shadow-xs">
          {/* Top Header & Actions Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Tablo Listesini Göster"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Tablolar ({filteredTables.length})</span>
                </button>
              )}
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer border-0 bg-transparent"
                  title="Tablo Listesini Gizle (Genişletilmiş Tablo Görünümü)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                📂 {selectedTable || 'Seçilmedi'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold font-sans">
                ({totalRows.toLocaleString('tr-TR')} toplam kayıt)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'data' && (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Verilerde ara..."
                      value={dataSearch}
                      onChange={(e) => setDataSearch(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 font-sans"
                    />
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border-0 shadow-sm"
                    title="Yeni Satır Ekle"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Kayıt</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border-0"
                    title="Excel / CSV Formatında İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel / CSV</span>
                  </button>
                </>
              )}

              <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-sans ml-2">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'data'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tablo Verileri (Düzenle)
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'schema'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Şema / Kolonlar
                </button>
                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'console'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  SQL Konsolu
                </button>
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`mb-3 p-2.5 rounded-xl text-xs flex items-center justify-between font-medium animate-in fade-in shrink-0 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* System Relational Warning Banner */}
          {activeTab === 'data' && (
            <div className="mb-3 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>⚠️ Sistem ve İlişkili ID Uyarısı:</strong> Primary Key (<code>PK</code>),
                Foreign Key (<code>FK</code> / <code>*_id</code>) veya sistem durum alanlarını
                değiştirirken veya bu satırları silerken dikkatli olun. Bu veriler diğer tablolarla
                (Dosya, Firma, Kalemler, Belge vb.) ilişkilidir.
              </span>
            </div>
          )}

          {/* Interactive Screen Content */}
          <div className="flex-1 overflow-hidden relative">
            {loading && activeTab !== 'console' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10 text-xs text-slate-500 italic">
                Veriler yükleniyor...
              </div>
            ) : null}

            {/* TAB 1: INTERACTIVE DATA GRID (EXCEL-LIKE CELL EDITING) */}
            {activeTab === 'data' && (
              <DataTableTab
                filteredRows={filteredRows}
                columns={columns}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                handleCellClick={handleCellClick}
                handleSaveCell={handleSaveCell}
                setDeletingRow={setDeletingRow}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalRows={totalRows}
                totalPages={totalPages}
                loading={loading}
              />
            )}

            {/* TAB 2: SCHEMA / COLUMNS */}
            {activeTab === 'schema' && <SchemaTab columns={columns} />}

            {/* TAB 3: SQL CONSOLE */}
            {activeTab === 'console' && (
              <SqlConsoleTab
                consoleQuery={consoleQuery}
                setConsoleQuery={setConsoleQuery}
                selectedTable={selectedTable}
                consoleLoading={consoleLoading}
                consoleError={consoleError}
                consoleResults={consoleResults}
                handleRunQuery={handleRunQuery}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW ROW */}
      <AddRowModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setNewRowData({})
        }}
        selectedTable={selectedTable}
        columns={columns}
        newRowData={newRowData}
        setNewRowData={setNewRowData}
        handleInsertRow={handleInsertRow}
      />

      {/* MODAL 2: DELETE CONFIRMATION */}
      <DeleteRowModal
        deletingRow={deletingRow}
        onClose={() => setDeletingRow(null)}
        handleDeleteRowConfirm={handleDeleteRowConfirm}
      />
    </SubScreen>
  )
}
