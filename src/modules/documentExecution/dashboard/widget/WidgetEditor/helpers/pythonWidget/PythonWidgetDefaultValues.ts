import descriptor from './PythonWidgetDefaultValuesDescriptor.json'
import deepcopy from "deepcopy"

export const getdefaultEditorSettings = () => {
    return deepcopy(descriptor.defaultEditorSettings)
}
