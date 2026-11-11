import { configureTeminEngine } from '@temin360/document-templates'
import { DocumentEngine } from '@worksuite-360/document-engine'
import { createElectronStorageAdapter } from './services/electronDocumentStorageAdapter'

// Test ortamı için Temin 360 şablonlarını ve DocumentEngine adaptörlerini enjekte et (IoC)
const electronStorage = createElectronStorageAdapter()
DocumentEngine.setStorageAdapter(electronStorage)
DocumentEngine.setQueryExecutor(electronStorage.executeQuery!)
configureTeminEngine()

