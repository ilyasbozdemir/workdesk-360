import React from 'react'
import { Modal } from '../ui/Modal'
import { InspectionTimeline } from './InspectionTimeline'

interface InspectionTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  recordId?: number
  tableName?: string
  title?: string
}

export const InspectionTimelineModal: React.FC<InspectionTimelineModalProps> = ({
  isOpen,
  onClose,
  recordId,
  tableName,
  title = 'Teftiş Kurulu Güvenlik Denetim Günlüğü'
}) => {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Donanım kimliği (mac_hash) enjeksiyonlu, değiştirilemez SQLite teftiş geçmişi."
      className="max-w-4xl"
    >
      <InspectionTimeline
        recordId={recordId}
        tableName={tableName}
        showHeader={false}
        className="border-none shadow-none bg-transparent p-0"
      />
    </Modal>
  )
}
