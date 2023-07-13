import descriptor from './PythonWidgetDefaultValuesDescriptor.json'
import deepcopy from "deepcopy"

export const getDefaultEditorSettings = () => {
    return deepcopy(descriptor.defaultEditorSettings)
}
