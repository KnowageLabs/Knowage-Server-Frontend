import { startManagerTour } from '../managerListTour'

export const startDomainsTour = (t: (key: string) => string) => startManagerTour(t, 'managers.domainsManagement')
