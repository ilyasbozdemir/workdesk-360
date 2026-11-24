import React from 'react'
import { AppRoute } from '../../../../constants/routeConstants'

export interface StepConfig {
  id: number
  label: string
  shortLabel: string
  route: AppRoute
  icon: React.ElementType
  docTemplates: string[]
}

export interface ProcessStepperProps {
  currentRoute: string
}
