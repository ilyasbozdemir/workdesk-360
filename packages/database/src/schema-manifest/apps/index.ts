/* eslint-disable */
import { temin360Manifest } from './temin360'
import { ihale360Manifest } from './ihale360'
import { devletIhale2886Manifest } from './devlet-ihale-2886'

export { temin360Manifest } from './temin360'
export { ihale360Manifest } from './ihale360'
export { devletIhale2886Manifest } from './devlet-ihale-2886'

export const appManifests: Record<string, any> = {
  'temin360-desktop': temin360Manifest,
  'ihale360-desktop': ihale360Manifest,
  'devlet-ihale-2886-desktop': devletIhale2886Manifest
}

export default appManifests
