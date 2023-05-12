import { IDashboardView } from "../Dashboard"

export const saveDashboardView = async (view: IDashboardView, $http: any) => {
    return $http.post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/view`, view)
}

export const deleteDashboardView = async (view: IDashboardView, $http: any) => {
    return $http.delete(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/view/${view.id}`)
}