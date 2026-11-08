import React from 'react'
import {
  UserProfilePopover,
  UserProfilePopoverProps
} from './UserProfilePopover'

/**
 * @deprecated Use UserProfilePopover instead.
 * Bu bileşen geriye dönük uyumluluk için UserProfilePopover bileşenini dışa aktarır.
 */
export const RoleSimulatorPopover: React.FC<UserProfilePopoverProps> = (props) => {
  return <UserProfilePopover {...props} />
}

export default RoleSimulatorPopover
