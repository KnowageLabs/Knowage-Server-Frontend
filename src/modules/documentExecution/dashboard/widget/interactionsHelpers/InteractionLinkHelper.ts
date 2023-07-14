import { ITableWidgetLink, IWidgetInteractionParameter, IWidgetLinks } from "../../Dashboard";

interface IClickedValue { value: string, type: string }

export const openNewLinkTableWidget = (clickedValue: IClickedValue, formattedRow: any, linkOptions: IWidgetLinks, dashboardId: string) => {
    const formattedLinks = getFormattedLinks(linkOptions, formattedRow)
    console.log('--------- openNewLinkTableWidget() - formattedLinks: ', formattedLinks)
    formattedLinks.forEach((formattedLink: { url: string, action: string }) => {
        if (formattedLink.action === 'blank') window.open(formattedLink.url, '_blank');
    })
}

const getFormattedLinks = (linkOptions: IWidgetLinks, formattedRow: any) => {
    const formattedLinks = [] as { url: string, action: string }[]
    linkOptions.links?.forEach((link: ITableWidgetLink) => {
        const formattedLink = getFormattedLink(link, formattedRow)
        if (formattedLink) formattedLinks.push(formattedLink)
    })
    return formattedLinks
}

const getFormattedLink = (link: ITableWidgetLink, formattedRow: any) => {
    let url = link.baseurl
    let parameters = link.parameters.length > 0 ? getFormattedParametersUrl(link, formattedRow) : ''
    if (parameters) parameters = parameters.substring(0, parameters.length - 1)
    url += `?${parameters}`

    return { url: url, action: link.action }
}

const getFormattedParametersUrl = (link: ITableWidgetLink, formattedRow: any) => {
    let formattedParametersUrl = ''
    link.parameters.forEach((parameter: IWidgetInteractionParameter) => {
        if (parameter.type === 'static') {
            formattedParametersUrl += `${parameter.name}=${parameter.value}&`
        } else if (parameter.type === 'dynamic') {
            formattedParametersUrl += getFormattedDynamicParameterUrl(parameter, formattedRow)
        }
    })
    return formattedParametersUrl
}

const getFormattedDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedRow: any) => {
    let columnValue = ''
    if (parameter.column === 'column_name_mode') columnValue = formattedRow.columnName
    else if (parameter.column) columnValue = formattedRow[parameter.column].value
    return `${parameter.name}=${columnValue ?? ''}&`
}
