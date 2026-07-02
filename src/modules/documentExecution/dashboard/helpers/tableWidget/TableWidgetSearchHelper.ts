import { IWidgetSearch } from '../../Dashboard'

export const getTableWidgetLikeSelections = (searchParams: IWidgetSearch | undefined, datasetLabel?: string) => {
    if (!datasetLabel || !searchParams || searchParams.searchText === '' || !searchParams.searchColumns?.length) return null

    const formattedLikeSelections = searchParams.searchColumns.toString()
    return { [datasetLabel]: { [formattedLikeSelections]: searchParams.searchText } }
}
