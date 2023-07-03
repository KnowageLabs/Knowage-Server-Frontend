import descriptor from './RWidgetDefaultValuesDescriptor.json'
import deepcopy from "deepcopy"

export const getDefaultEditorSettings = () => {
    return deepcopy(descriptor.defaultEditorSettings)
}
