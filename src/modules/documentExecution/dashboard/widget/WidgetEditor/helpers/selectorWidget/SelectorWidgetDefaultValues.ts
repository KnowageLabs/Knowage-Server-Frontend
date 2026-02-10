import { ISelectorWidgetDefaultValues, ISelectorWidgetLabelStyle, ISelectorWidgetRadioStyle, ISelectorWidgetCheckboxStyle, ISelectorWidgetDropdownStyle, ISelectorWidgetMultiDropdownStyle, ISelectorWidgetDateStyle, ISelectorWidgetDateRangeStyle, ISelectorWidgetSliderStyle, ISelectorWidgetRangeStyle, ISelectorWidgetSelectorType, ISelectorWidgetValuesManagement } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import descriptor from './SelectorWidgetDefaultValuesDescriptor.json'
import deepcopy from 'deepcopy'

export const getDefaultSelectorType = () => {
    return deepcopy(descriptor.defaultSelectorType) as ISelectorWidgetSelectorType
}

export const getDefaultValues = () => {
    return deepcopy(descriptor.defaultValues) as ISelectorWidgetDefaultValues
}

export const getDefaultValuesManagement = () => {
    return deepcopy(descriptor.defaultValuesManagement) as ISelectorWidgetValuesManagement
}

export const getDefaultLabelStyle = () => {
    return deepcopy(descriptor.defaultLabelStyle) as ISelectorWidgetLabelStyle
}

export const getDefaultRadioStyle = () => {
    return deepcopy(descriptor.defaultRadioStyle) as ISelectorWidgetRadioStyle
}

export const getDefaultCheckboxStyle = () => {
    return deepcopy(descriptor.defaultCheckboxStyle) as ISelectorWidgetCheckboxStyle
}

export const getDefaultDropdownStyle = () => {
    return deepcopy(descriptor.defaultDropdownStyle) as ISelectorWidgetDropdownStyle
}

export const getDefaultMultiDropdownStyle = () => {
    return deepcopy(descriptor.defaultMultiDropdownStyle) as ISelectorWidgetMultiDropdownStyle
}

export const getDefaultDateStyle = () => {
    return deepcopy(descriptor.defaultDateStyle) as ISelectorWidgetDateStyle
}

export const getDefaultDateRangeStyle = () => {
    return deepcopy(descriptor.defaultDateRangeStyle) as ISelectorWidgetDateRangeStyle
}

export const getDefaultSliderStyle = () => {
    return deepcopy(descriptor.defaultSliderStyle) as ISelectorWidgetSliderStyle
}

export const getDefaultRangeStyle = () => {
    return deepcopy(descriptor.defaultRangeStyle) as ISelectorWidgetRangeStyle
}
