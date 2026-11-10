import { startManagerTour } from '../managerListTour'

export const startConfigurationTour = (t: (key: string) => string) => startManagerTour(t, 'managers.configurationManagement')
