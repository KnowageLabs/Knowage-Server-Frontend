import { ISelection } from "../../Dashboard"
import { formatDateWithLocale } from "@/helpers/commons/localeHelper"
import dashboardDescriptor from '../../DashboardDescriptor.json'
import moment from "moment"

export const formatSelectionForDisplay = (selection: ISelection) => {
    if (!selection.value) return ''
    let result = ''
    for (let i = 0; i < selection.value.length; i++) {
        const tempValue = selection.value[i]
        if (moment(tempValue, dashboardDescriptor.selectionsDateFormat, true).isValid()) {
            const ts = moment(tempValue as string, dashboardDescriptor.selectionsDateFormat, true).valueOf()
            result += formatDateWithLocale(ts, { dateStyle: 'short', timeStyle: 'medium' }) + ' '
        } else if (moment(tempValue, dashboardDescriptor.selectionsDateMultiFormat, true).isValid()) {
            const ts = moment(tempValue as string, dashboardDescriptor.selectionsDateMultiFormat, true).valueOf()
            result += formatDateWithLocale(ts, { dateStyle: 'short' }) + ' '
        } else {
            result += tempValue + ' '
        }
    }
    return result.trim()
}