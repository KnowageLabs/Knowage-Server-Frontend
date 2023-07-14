import { ITableWidgetLink, IWidgetLinks } from "../../Dashboard";

interface IClickedValue { value: string, type: string }

export const openNewLinkTableWidget = (clickedValue: IClickedValue, formattedRow: any, linkOptions: IWidgetLinks, dashboardId: string) => {
    console.log('--------- openNewLinkTableWidget() - clickedValue: ', clickedValue)
    console.log('--------- openNewLinkTableWidget() - formattedRow: ', formattedRow)

    console.log('--------- openNewLinkTableWidget() - dashboardId: ', dashboardId)
    const formattedLinks = getFormattedLinks(linkOptions)
    console.log('--------- openNewLinkTableWidget() - formattedLinks: ', formattedLinks)
    formattedLinks.forEach((formattedLink: { url: string, action: string }) => {
        if (formattedLink.action === 'blank') window.open(formattedLink.url, '_blank');
    })
}

const getFormattedLinks = (linkOptions: IWidgetLinks) => {
    console.log('--------- openNewLinkTableWidget() - linkOptions: ', linkOptions)
    const formattedLinks = [] as { url: string, action: string }[]
    linkOptions.links?.forEach((link: ITableWidgetLink) => {
        const formattedLink = getFormattedLink(link)
        if (formattedLink) formattedLinks.push(formattedLink)
    })
    return formattedLinks
}

const getFormattedLink = (link: ITableWidgetLink) => {
    console.log('------- LINK: ', link)
    const url = link.baseurl
    return { url: url, action: link.action }
}