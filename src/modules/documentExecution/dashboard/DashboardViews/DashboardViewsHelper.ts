import { IDashboardView } from "../Dashboard"

export const deleteView = async (view: IDashboardView, $http: any) => {
    return $http.delete(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/view/${view.id}`, { headers: { 'X-Disable-Errors': 'true' } })
}