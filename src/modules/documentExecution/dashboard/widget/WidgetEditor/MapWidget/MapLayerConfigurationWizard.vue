<template>
    <q-dialog
        v-model="dialogVisible"
        persistent
        transition-show="slide-left"
        transition-hide="slide-right"
        content-class="wizard-overlay-dialog"
        position="right"
    >
        <q-card class="layer-wizard-card">
            <!-- Stepper Navigation -->
            <q-card-section class="stepper-nav">
                <div class="steps">
                    <div
                        class="step"
                        :class="{ active: currentStep === 1, completed: currentStep > 1 }"
                    >
                        <div class="step-number">1</div>
                        <div class="step-label">{{ $t('dashboard.widgetEditor.map.visualizationType') }}</div>
                    </div>
                    <div class="step-divider"></div>
                    <div
                        class="step"
                        :class="{ active: currentStep === 2 }"
                    >
                        <div class="step-number">2</div>
                        <div class="step-label">{{ $t('dashboard.widgetEditor.map.dataConnection') }}</div>
                    </div>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Step Content -->
            <q-card-section class="wizard-content">
                <!-- Step 1: Visualization Type Selection -->
                <div v-show="currentStep === 1" class="step-content">
                    <div class="viz-section">
                        <h4>{{ $t('dashboard.widgetEditor.map.visualizationOptions') }}</h4>
                        <p class="section-description">
                            {{ $t('dashboard.widgetEditor.map.visualizationOptionsDesc') }}
                        </p>

                        <!-- Visualization Type Selection -->
                        <div class="viz-type-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.selectVisualizationType') }}
                            </label>
                            <div class="viz-type-cards">
                                <div
                                    v-for="vizType in visualizationTypes"
                                    :key="vizType.value"
                                    class="viz-type-card"
                                    :class="{ selected: selectedVisualizationType === vizType.value }"
                                    @click="selectedVisualizationType = vizType.value"
                                >
                                    <q-icon :name="vizType.icon" size="md" />
                                    <div class="card-title">{{ $t(vizType.label) }}</div>
                                    <div class="card-description">{{ $t(vizType.description) }}</div>
                                    <q-icon
                                        v-if="selectedVisualizationType === vizType.value"
                                        name="check_circle"
                                        size="sm"
                                        class="check-icon"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Chart Type Selection (for charts only) -->
                        <div v-if="selectedVisualizationType === 'charts'" class="chart-type-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.chartType') }}
                            </label>
                            <div class="chart-type-cards">
                                <div
                                    class="chart-type-option"
                                    :class="{ selected: visualizationConfig.chartType === 'pies' }"
                                    @click="visualizationConfig.chartType = 'pies'"
                                >
                                    <q-icon name="pie_chart" size="md" />
                                    <span>{{ $t('dashboard.widgetEditor.map.chartTypes.pies') }}</span>
                                    <q-icon
                                        v-if="visualizationConfig.chartType === 'pies'"
                                        name="check_circle"
                                        size="sm"
                                        class="check-icon"
                                    />
                                </div>
                                <div
                                    class="chart-type-option"
                                    :class="{ selected: visualizationConfig.chartType === 'bar' }"
                                    @click="visualizationConfig.chartType = 'bar'"
                                >
                                    <q-icon name="bar_chart" size="md" />
                                    <span>{{ $t('dashboard.widgetEditor.map.chartTypes.bar') }}</span>
                                    <q-icon
                                        v-if="visualizationConfig.chartType === 'bar'"
                                        name="check_circle"
                                        size="sm"
                                        class="check-icon"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Heatmap Configuration (for heatmap only) -->
                        <div v-if="selectedVisualizationType === 'heatmap'" class="heatmap-config-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.heatmapConfiguration') }}
                            </label>
                            <!-- Put all three controls on a single row -->
                            <div class="config-row three-col-row">
                                <q-input
                                    v-model.number="visualizationConfig.heatmapRadius"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.heatmapRadius')"
                                    :hint="$t('dashboard.widgetEditor.map.heatmapRadiusHint')"
                                    :min="5"
                                    :max="100"
                                    suffix="px"
                                    dense
                                />

                                <q-input
                                    v-model.number="visualizationConfig.heatmapBlur"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.heatmapBlur')"
                                    :hint="$t('dashboard.widgetEditor.map.heatmapBlurHint')"
                                    :min="5"
                                    :max="50"
                                    dense
                                />

                                <q-input
                                    v-model.number="visualizationConfig.heatmapMaxZoom"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.heatmapMaxZoom')"
                                    :hint="$t('dashboard.widgetEditor.map.heatmapMaxZoomHint')"
                                    :min="1"
                                    :max="22"
                                    dense
                                />
                            </div>
                        </div>

                        <!-- Markers Configuration -->
                        <div v-if="selectedVisualizationType === 'markers'" class="marker-config-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.markerConfiguration') }}
                            </label>
                            <div class="markers-controls">
                                <!-- Markers controls: when markerType is default show type, size and color on the same row -->
                                <div v-if="visualizationConfig.markerType === 'default'" class="three-col-row">
                                    <q-select
                                        v-model="visualizationConfig.markerType"
                                        outlined
                                        dense
                                        :options="markerTypeOptions"
                                        :label="$t('dashboard.widgetEditor.map.markerType')"
                                        option-value="value"
                                        option-label="label"
                                        emit-value
                                        map-options
                                    >
                                        <template v-slot:option="scope">
                                            <q-item v-bind="scope.itemProps">
                                                <q-item-section>
                                                    <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                                                </q-item-section>
                                            </q-item>
                                        </template>
                                        <template v-slot:selected>
                                            {{ $t(markerTypeOptions.find(m => m.value === visualizationConfig.markerType)?.label || '') }}
                                        </template>
                                    </q-select>

                                    <q-input
                                        v-model.number="visualizationConfig.markerSize"
                                        outlined
                                        type="number"
                                        :label="$t('dashboard.widgetEditor.map.markerSize')"
                                        :min="5"
                                        :max="100"
                                        suffix="px"
                                        dense
                                    />

                                    <WidgetEditorColorPicker
                                        :initial-value="visualizationConfig.fromColor"
                                        :label="$t('common.color')"
                                        @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                    />
                                </div>

                                <!-- Non-default marker types: keep existing layout -->
                                <div v-else class="config-row">
                                    <q-select
                                        v-model="visualizationConfig.markerType"
                                        outlined
                                        dense
                                        :options="markerTypeOptions"
                                        :label="$t('dashboard.widgetEditor.map.markerType')"
                                        option-value="value"
                                        option-label="label"
                                        emit-value
                                        map-options
                                    >
                                        <template v-slot:option="scope">
                                            <q-item v-bind="scope.itemProps">
                                                <q-item-section>
                                                    <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                                                </q-item-section>
                                            </q-item>
                                        </template>
                                        <template v-slot:selected>
                                            {{ $t(markerTypeOptions.find(m => m.value === visualizationConfig.markerType)?.label || '') }}
                                        </template>
                                    </q-select>

                                    <q-input
                                        v-model.number="visualizationConfig.markerSize"
                                        outlined
                                        type="number"
                                        :label="$t('dashboard.widgetEditor.map.markerSize')"
                                        :min="5"
                                        :max="100"
                                        suffix="px"
                                        dense
                                    />
                                </div>
                            </div>

                            <!-- Non-default marker types: show color picker and picker controls inline for icon/img types -->
                            <div v-if="visualizationConfig.markerType !== 'default'">
                                <!-- Icon type: color + icon picker on same row -->
                                <div v-if="visualizationConfig.markerType === 'icon'" class="config-row">
                                    <WidgetEditorColorPicker
                                        :initial-value="visualizationConfig.fromColor"
                                        :label="$t('common.color')"
                                        @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                    />

                                    <div class="picker-inline">
                                        <q-input
                                            :model-value="visualizationConfig.iconClass || 'fa fa-map-marker'"
                                            outlined
                                            readonly
                                            :label="$t('dashboard.widgetEditor.iconTooltips.iconPicker')"
                                            dense
                                        />
                                        <q-btn
                                            flat
                                            round
                                            icon="fas fa-icons"
                                            size="lg"
                                            color="primary"
                                            @click="iconPickerVisible = true"
                                        >
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.iconTooltips.iconPicker') }}</q-tooltip>
                                        </q-btn>
                                    </div>
                                </div>

                                <!-- Img type: color + image picker on same row -->
                                <div v-else-if="visualizationConfig.markerType === 'img'" class="config-row">
                                    <WidgetEditorColorPicker
                                        :initial-value="visualizationConfig.fromColor"
                                        :label="$t('common.color')"
                                        @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                    />

                                    <div class="picker-inline">
                                        <q-input
                                            :model-value="visualizationConfig.iconImg || ''"
                                            outlined
                                            readonly
                                            :label="$t('dashboard.widgetEditor.map.imageUrl')"
                                            dense
                                            :hint="$t('dashboard.widgetEditor.map.imageUrlHint')"
                                        />
                                        <q-btn
                                            flat
                                            round
                                            icon="fas fa-images"
                                            size="lg"
                                            color="primary"
                                            @click="imagePickerVisible = true"
                                        >
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.iconTooltips.imagePicker') }}</q-tooltip>
                                        </q-btn>
                                    </div>
                                </div>

                                <!-- Url type: color + url input on same row -->
                                <div v-else-if="visualizationConfig.markerType === 'url'" class="config-row">
                                    <WidgetEditorColorPicker
                                        :initial-value="visualizationConfig.fromColor"
                                        :label="$t('common.color')"
                                        @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                    />

                                    <div class="picker-inline">
                                        <q-input
                                            v-model="visualizationConfig.iconUrl"
                                            outlined
                                            :label="$t('dashboard.widgetEditor.map.markerTypes.iconUrl')"
                                            dense
                                            :hint="$t('dashboard.widgetEditor.map.iconUrlHint')"
                                        />
                                    </div>
                                </div>

                                <!-- Other non-default types: only color or existing fields -->
                                <div v-else class="config-row">
                                    <WidgetEditorColorPicker
                                        :initial-value="visualizationConfig.fromColor"
                                        :label="$t('common.color')"
                                        @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                    />

                                    <!-- placeholder to keep grid alignment for the second column -->
                                    <div></div>
                                </div>
                            </div>
                        </div>

                        <!-- Choropleth Configuration -->
                        <div v-if="selectedVisualizationType === 'choropleth'" class="color-config-section">
                            <label class="section-label">{{ $t('dashboard.widgetEditor.map.styleConfiguration') }}</label>

                            <!-- Row 1: three color pickers -->
                            <div class="config-row three-col-row">
                                <WidgetEditorColorPicker
                                    :initial-value="visualizationConfig.fromColor"
                                    :label="$t('dashboard.widgetEditor.map.fromColor')"
                                    @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                />

                                <WidgetEditorColorPicker
                                    :initial-value="visualizationConfig.toColor"
                                    :label="$t('dashboard.widgetEditor.map.toColor')"
                                    @change="(newColor) => { visualizationConfig.toColor = newColor }"
                                />

                                <WidgetEditorColorPicker
                                    :initial-value="visualizationConfig.borderColor"
                                    :label="$t('dashboard.widgetEditor.map.borderColor')"
                                    @change="(newColor) => { visualizationConfig.borderColor = newColor }"
                                />
                            </div>

                            <!-- Row 2: classification method, number of classes, border width -->
                            <div class="config-row three-col-row">
                                <q-select
                                    v-model="visualizationConfig.classificationMethod"
                                    outlined
                                    dense
                                    :options="classificationMethodOptions"
                                    :label="$t('dashboard.widgetEditor.map.classesMethodOptions.title')"
                                    option-value="value"
                                    option-label="label"
                                    emit-value
                                    map-options
                                >
                                    <template v-slot:option="scope">
                                        <q-item v-bind="scope.itemProps">
                                            <q-item-section>
                                                <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                    <template v-slot:selected>
                                        {{ $t(classificationMethodOptions.find(m => m.value === visualizationConfig.classificationMethod)?.label || '') }}
                                    </template>
                                </q-select>

                                <q-input
                                    v-model.number="visualizationConfig.numberOfClasses"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.numberOfClasses')"
                                    :min="2"
                                    :max="10"
                                    dense
                                />

                                <q-input
                                    v-model.number="visualizationConfig.borderWidth"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.borderWidth')"
                                    :min="0"
                                    :max="10"
                                    dense
                                />
                            </div>
                        </div>

                        <!-- Balloons Configuration -->
                        <div v-if="selectedVisualizationType === 'balloons'" class="balloon-config-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.styleConfiguration') }}
                            </label>
                            <!-- Put color, classification method and number of classes on a single row -->
                            <div class="config-row three-col-row">
                                <WidgetEditorColorPicker
                                    :initial-value="visualizationConfig.fromColor"
                                    :label="$t('common.color')"
                                    @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                />

                                <q-select
                                    v-model="visualizationConfig.classificationMethod"
                                    outlined
                                    dense
                                    :options="classificationMethodOptions"
                                    :label="$t('dashboard.widgetEditor.map.classesMethodOptions.title')"
                                    option-value="value"
                                    option-label="label"
                                    emit-value
                                    map-options
                                >
                                    <template v-slot:option="scope">
                                        <q-item v-bind="scope.itemProps">
                                            <q-item-section>
                                                <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                    <template v-slot:selected>
                                        {{ $t(classificationMethodOptions.find(m => m.value === visualizationConfig.classificationMethod)?.label || '') }}
                                    </template>
                                </q-select>

                                <q-input
                                    v-model.number="visualizationConfig.numberOfClasses"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.numberOfClasses')"
                                    :min="2"
                                    :max="10"
                                    dense
                                />
                            </div>
                        </div>

                        <!-- Clusters Configuration -->
                        <div v-if="selectedVisualizationType === 'clusters'" class="cluster-config-section">
                            <label class="section-label">
                                {{ $t('dashboard.widgetEditor.map.clusterConfiguration') }}
                            </label>
                            <div class="config-row">
                                <q-input
                                    v-model.number="visualizationConfig.clusterRadius"
                                    outlined
                                    type="number"
                                    :label="$t('dashboard.widgetEditor.map.clusterRadius')"
                                    :hint="$t('dashboard.widgetEditor.map.clusterRadiusHint')"
                                    :min="10"
                                    :max="200"
                                    suffix="px"
                                    dense
                                />
                                <WidgetEditorColorPicker
                                    :initial-value="visualizationConfig.fromColor"
                                    :label="$t('common.color')"
                                    @change="(newColor) => { visualizationConfig.fromColor = newColor }"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Data Connection -->
                <div v-show="currentStep === 2" class="step-content">
                    <!-- Layer/Dataset Selection -->
                    <div class="config-section">
                        <label class="section-label">{{ $t('dashboard.widgetEditor.map.selectTargetLayer') }}</label>
                        <p class="section-subtitle">{{ $t('dashboard.widgetEditor.map.selectTargetLayerHint') }}</p>

                        <q-select
                            v-model="visualizationData.target"
                            filled
                            dense
                            :options="availableLayersOptions"
                            :label="$t('common.layer')"
                            option-value="layerId"
                            option-label="name"
                            emit-value
                            map-options
                            options-dense
                            @update:model-value="onTargetChange"
                        >
                            <template v-slot:prepend>
                                <q-icon name="layers" />
                            </template>
                        </q-select>
                    </div>

                    <!-- Connection Type Selection -->
                    <div class="config-section" v-if="visualizationData.target">
                        <label class="section-label">{{ $t('dashboard.widgetEditor.map.connectionType') }}</label>
                        <p class="section-subtitle">{{ $t('dashboard.widgetEditor.map.connectionTypeHint') }}</p>

                        <div class="connection-type-cards">
                            <div
                                v-for="connType in availableConnectionTypes"
                                :key="connType.value"
                                class="connection-card"
                                :class="{ selected: visualizationData.connectionType === connType.value }"
                                @click="setConnectionType(connType.value)"
                            >
                                <q-icon :name="connType.icon" size="md" />
                                <div class="card-title">{{ $t(connType.label) }}</div>
                                <div class="card-description">{{ $t(connType.description) }}</div>
                                <q-icon
                                    v-if="visualizationData.connectionType === connType.value"
                                    name="check_circle"
                                    size="sm"
                                    class="check-icon"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Show rest of form only after target is selected -->
                    <template v-if="visualizationData.target">
                        <!-- If connection is single, show label + measure/property + inline toggle on one row -->
                        <div v-if="visualizationData.connectionType === 'single'" class="data-connection-row">
                            <q-input
                                v-model="visualizationData.label"
                                filled
                                dense
                                :label="$t('common.label')"
                                class="layer-name-input"
                            />

                            <!-- Measures / Property selector (adapts to layer/dataset and charts vs others) -->
                            <div>
                                <q-select
                                    v-if="getSelectedLayerType() === 'dataset' && selectedVisualizationType === 'charts'"
                                    v-model="visualizationData.chartMeasures"
                                    filled
                                    dense
                                    multiple
                                    use-chips
                                    :options="availableMeasuresForSingle()"
                                    :label="$t('common.measures')"
                                    option-value="name"
                                    option-label="name"
                                    emit-value
                                    map-options
                                    options-dense
                                >
                                    <template v-slot:hint>
                                        {{ $t('dashboard.widgetEditor.map.minTwoMeasures') }}
                                    </template>
                                </q-select>

                                <q-select
                                    v-else-if="getSelectedLayerType() === 'dataset'"
                                    v-model="visualizationData.targetMeasure"
                                    filled
                                    dense
                                    :options="availableMeasuresForSingle()"
                                    :label="$t('common.measure')"
                                    option-value="name"
                                    option-label="name"
                                    emit-value
                                    map-options
                                    options-dense
                                />

                                <q-select
                                    v-else
                                    v-model="visualizationData.targetProperty"
                                    filled
                                    dense
                                    :options="visualizationData.properties || []"
                                    :label="$t('common.properties')"
                                    option-value="property"
                                    option-label="property"
                                    emit-value
                                    map-options
                                    options-dense
                                />
                            </div>

                            <div class="inline-toggle">
                                <label class="show-label">{{ $t('common.show') }}</label>
                                <q-toggle v-model="visualizationData.visible" color="primary" />
                            </div>
                        </div>

                        <!-- If connection is join, keep label and toggle together on the left to avoid large empty middle column -->
                        <div v-else class="config-row join-compact-row">
                            <div class="label-with-toggle">
                                <q-input
                                    v-model="visualizationData.label"
                                    filled
                                    dense
                                    :label="$t('common.label')"
                                    :rules="[(val) => !!(val && val.toString().trim()) || $t('common.required')]"
                                    class="layer-name-input"
                                />

                                <!-- Put the show-toggle next to the label input for join mode -->
                                <div class="inline-toggle">
                                    <label class="show-label">{{ $t('common.show') }}</label>
                                    <q-toggle v-model="visualizationData.visible" color="primary" />
                                </div>
                            </div>

                            <!-- keep second column empty to preserve grid alignment for join controls below -->
                            <div></div>
                        </div>

                        <!-- Data Join -->
                        <div v-if="visualizationData.connectionType === 'join'">
                            <!-- Row 1: Dataset + Measure -->
                            <div class="config-row">
                                <q-select
                                    v-model="visualizationData.targetDataset"
                                    filled
                                    dense
                                    :options="availableDatasets"
                                    :label="$t('common.dataset')"
                                    option-value="layerId"
                                    option-label="name"
                                    emit-value
                                    map-options
                                    options-dense
                                />

                                <!-- Charts: Multiple Measures -->
                                <q-select
                                    v-if="visualizationData.targetDataset && selectedVisualizationType === 'charts'"
                                    v-model="visualizationData.chartMeasures"
                                    filled
                                    dense
                                    multiple
                                    use-chips
                                    :options="availableMeasures(visualizationData.targetDataset)"
                                    :label="$t('common.measures')"
                                    option-value="name"
                                    option-label="name"
                                    emit-value
                                    map-options
                                    options-dense
                                >
                                    <template v-slot:hint>
                                        {{ $t('dashboard.widgetEditor.map.minTwoMeasures') }}
                                    </template>
                                </q-select>

                                <!-- Other types: Single Measure -->
                                <q-select
                                    v-else-if="visualizationData.targetDataset"
                                    v-model="visualizationData.targetMeasure"
                                    filled
                                    dense
                                    :options="availableMeasures(visualizationData.targetDataset)"
                                    :label="$t('common.measure')"
                                    option-value="name"
                                    option-label="name"
                                    emit-value
                                    map-options
                                    options-dense
                                />
                            </div>

                            <!-- Row 2: Join Column + Join Property -->
                            <div v-if="visualizationData.targetDataset">
                                    <div class="config-section data-join">
                                    <div class="data-join-header">
                                        <label class="section-label">{{ $t('dashboard.widgetEditor.map.dataJoin') }}</label>
                                    </div>
                                    <div class="data-join-container">
                                        <q-select
                                            v-model="visualizationData.targetDatasetForeignKeyColumn"
                                            filled
                                            dense
                                            :options="availableTargetDatasetColumns(visualizationData.targetDataset)"
                                            :label="$t('dashboard.widgetEditor.map.datasetJoinColumn')"
                                            option-value="name"
                                            option-label="name"
                                            emit-value
                                            map-options
                                            options-dense
                                            class="join-field"
                                        />

                                        <div class="join-icon" aria-hidden="true">
                                            <q-icon name="compare_arrows" />
                                        </div>

                                        <!-- Join Property (for layers only) -->
                                        <q-select
                                            v-if="getSelectedLayerType() === 'layer'"
                                            v-model="visualizationData.targetProperty"
                                            filled
                                            dense
                                            :options="visualizationData.properties || []"
                                            :label="$t('dashboard.widgetEditor.map.joinProperty')"
                                            option-value="property"
                                            option-label="property"
                                            emit-value
                                            map-options
                                            options-dense
                                            class="join-field"
                                        >
                                            <template v-slot:hint>
                                                {{ $t('dashboard.widgetEditor.map.propertyUsedForJoin') }}
                                            </template>
                                        </q-select>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </template>
                </div>
            </q-card-section>

            <!-- Footer Actions -->
            <q-separator />
            <q-card-actions class="wizard-footer">
                <q-btn
                    flat
                    :label="$t('common.cancel')"
                    @click="closeDialog"
                />
                <q-space />
                <q-btn
                    v-if="currentStep > 1"
                    flat
                    :label="$t('common.back')"
                    @click="currentStep--"
                />
                <q-btn
                    v-if="currentStep < 2"
                    unelevated
                    color="primary"
                    :label="$t('common.next')"
                    icon-right="arrow_forward"
                    @click="currentStep++"
                    :disable="!canProceed"
                />
                <q-btn
                    v-else
                    unelevated
                    color="primary"
                    :label="$t('common.save')"
                    icon-right="check"
                    @click="saveConfiguration"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- Icon Picker Dialog - OUTSIDE main dialog using Teleport -->
    <Teleport to="body">
        <div style="z-index: 99999 !important; position: relative;">
            <WidgetEditorStyleIconPickerDialog
                v-if="iconPickerVisible"
                :prop-model="{}"
                @close="iconPickerVisible = false"
                @save="onIconSelected"
            />
        </div>
    </Teleport>

    <!-- Image Gallery Dialog - OUTSIDE main dialog using Teleport -->
    <Teleport to="body">
        <div style="z-index: 99999 !important; position: relative;">
            <MapVisualizationImagePickerDialog
                :visible="imagePickerVisible"
                @close="imagePickerVisible = false"
                @setImage="onImageSelected"
            />
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import { IMapWidgetLayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IDataset } from '@/modules/documentExecution/dashboard/Dashboard'
import { getPropertiesByLayerLabel } from '../../MapWidget/MapWidgetDataProxy'
import WidgetEditorColorPicker from '../WidgetEditorSettingsTab/common/WidgetEditorColorPicker.vue'
import WidgetEditorStyleIconPickerDialog from '../WidgetEditorSettingsTab/common/styleToolbar/WidgetEditorStyleIconPickerDialog.vue'
import MapVisualizationImagePickerDialog from '../WidgetEditorSettingsTab/MapWidget/visualization/markers/MapVisualizationImagePickerDialog.vue'

export default defineComponent({
    name: 'map-layer-configuration-wizard',
    components: {
        WidgetEditorColorPicker,
        WidgetEditorStyleIconPickerDialog,
        MapVisualizationImagePickerDialog
    },
    props: {
        visible: { type: Boolean, required: true },
        layer: { type: Object as PropType<IMapWidgetLayer | null>, default: null },
        datasets: { type: Array as PropType<IDataset[]>, default: () => [] },
        widgetModel: { type: Object as PropType<any>, required: true },
        selectedVisualization: { type: Object as PropType<any | null>, default: null }
    },
    emits: ['close', 'save'],
    data() {
        return {
            dialogVisible: false,
            currentStep: 1,
            availableLayersOptions: [] as { layerId: string | null; name: string }[],
            propertiesCache: new Map<string, any[]>(),
            visualizationData: {
                label: '',
                target: '',
                connectionType: 'single' as 'single' | 'join',
                visible: true,
                targetType: 'column' as 'column' | 'property',
                targetDataset: undefined as string | undefined,
                targetMeasure: undefined as string | undefined,
                targetProperty: null as string | null,
                targetDatasetForeignKeyColumn: undefined as string | undefined,
                targetDatasetMeasures: [] as string[],
                chartMeasures: [] as string[],
                properties: [] as any[]
            },
            layerConfig: {
                name: '',
                sourceType: '',
                sourceName: '',
                columnReference: '',
                primaryIdProperty: '',
                longitudeColumn: '',
                latitudeColumn: ''
            },
            selectedVisualizationType: 'choropleth',
            visualizationConfig: {
                classificationMethod: 'CLASSIFY_BY_EQUAL_INTERVALS',
                numberOfClasses: 5,
                fromColor: 'rgba(59, 130, 246, 1)',
                toColor: 'rgba(236, 72, 153, 1)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1,
                chartType: 'pies' as 'pies' | 'bar',
                markerType: 'default',
                markerSize: 20,
                clusterRadius: 40,
                opacity: 75,
                heatmapRadius: 25,
                heatmapBlur: 15,
                heatmapMaxZoom: 18,
                iconClass: 'fa fa-map-marker',
                iconUrl: '',
                iconImg: ''
            },
            iconPickerVisible: false,
            imagePickerVisible: false,
            classificationMethodOptions: [
                {
                    label: 'dashboard.widgetEditor.map.classesMethodOptions.byEqualIntervals',
                    value: 'CLASSIFY_BY_EQUAL_INTERVALS'
                },
                {
                    label: 'dashboard.widgetEditor.map.classesMethodOptions.byQuantils',
                    value: 'CLASSIFY_BY_QUANTILS'
                },
                {
                    label: 'dashboard.widgetEditor.map.classesMethodOptions.byRanges',
                    value: 'CLASSIFY_BY_RANGES'
                }
            ],
            visualizationTypes: [
                {
                    value: 'choropleth',
                    icon: 'map',
                    label: 'dashboard.widgetEditor.map.visTypes.choropleth',
                    description: 'dashboard.widgetEditor.map.choroplethDesc'
                },
                {
                    value: 'markers',
                    icon: 'place',
                    label: 'dashboard.widgetEditor.map.visTypes.markers',
                    description: 'dashboard.widgetEditor.map.markersDesc'
                },
                {
                    value: 'heatmap',
                    icon: 'blur_on',
                    label: 'dashboard.widgetEditor.map.visTypes.heatmap',
                    description: 'dashboard.widgetEditor.map.heatmapDesc'
                },
                {
                    value: 'clusters',
                    icon: 'group_work',
                    label: 'dashboard.widgetEditor.map.visTypes.clusters',
                    description: 'dashboard.widgetEditor.map.clustersDesc'
                },
                {
                    value: 'charts',
                    icon: 'pie_chart',
                    label: 'dashboard.widgetEditor.map.visTypes.charts',
                    description: 'dashboard.widgetEditor.map.chartsDesc'
                },
                {
                    value: 'balloons',
                    icon: 'bubble_chart',
                    label: 'dashboard.widgetEditor.map.visTypes.balloons',
                    description: 'dashboard.widgetEditor.map.balloonsDesc'
                }
            ],
            markerTypeOptions: [
                { value: 'default', label: 'dashboard.widgetEditor.map.markerTypes.default' },
                { value: 'icon', label: 'dashboard.widgetEditor.map.markerTypes.icon' },
                { value: 'img', label: 'dashboard.widgetEditor.map.markerTypes.image' },
                { value: 'url', label: 'dashboard.widgetEditor.map.markerTypes.iconUrl' }
            ]
        }
    },
    computed: {
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: any) => layer.type === 'dataset')
        },
        availableConnectionTypes() {
            const layerType = this.getSelectedLayerType()

            if (layerType === 'layer') {
                return [
                    {
                        value: 'single',
                        icon: 'layers',
                        label: 'dashboard.widgetEditor.map.singleLayer',
                        description: 'dashboard.widgetEditor.map.singleLayerDesc'
                    },
                    {
                        value: 'join',
                        icon: 'compare_arrows',
                        label: 'dashboard.widgetEditor.map.dataJoin',
                        description: 'dashboard.widgetEditor.map.dataJoinLayerDesc'
                    }
                ]
            } else {
                return [
                    {
                        value: 'single',
                        icon: 'storage',
                        label: 'dashboard.widgetEditor.map.singleDataset',
                        description: 'dashboard.widgetEditor.map.singleDatasetDesc'
                    },
                    {
                        value: 'join',
                        icon: 'compare_arrows',
                        label: 'dashboard.widgetEditor.map.dataJoin',
                        description: 'dashboard.widgetEditor.map.dataJoinDatasetDesc'
                    }
                ]
            }
        },
        canProceed() {
            if (this.currentStep === 1) {
                // Step 1: Must select visualization type
                return !!this.selectedVisualizationType
            }

            if (this.currentStep === 2) {
                // Step 2: Must have label and target
                if (!this.visualizationData.label || !this.visualizationData.target) {
                    console.log('❌ canProceed FALSE: Missing label or target')
                    return false
                }

                // Charts: Require at least 2 measures
                if (this.selectedVisualizationType === 'charts') {
                    const canProceed = this.visualizationData.chartMeasures && this.visualizationData.chartMeasures.length >= 2
                    console.log('🔍 Charts validation:', {
                        chartMeasures: this.visualizationData.chartMeasures,
                        length: this.visualizationData.chartMeasures?.length,
                        canProceed
                    })
                    return canProceed
                }

                // Other types: Require targetMeasure OR targetProperty
                return !!(this.visualizationData.targetMeasure || this.visualizationData.targetProperty)
            }

            return true
        }
    },
    watch: {
        visible(newVal) {
            this.dialogVisible = newVal
            if (newVal) {
                this.loadWizardData()
            }
        },
        'visualizationData.chartMeasures': {
            handler(newVal) {
                console.log('📊 chartMeasures CHANGED:', newVal)
            },
            deep: true
        }
    },
    mounted() {
        if (this.visible) {
            this.loadWizardData()
        }
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadWizardData() {
            this.loadLayersOptions()

            // If editing existing visualization, load it
            if (this.selectedVisualization) {
                this.loadExistingVisualization()
            }
            // If layer is provided (from layers tab), set it as target
            else if (this.layer) {
                this.visualizationData.target = this.layer.layerId
            }
        },
        loadExistingVisualization() {
            if (!this.selectedVisualization) return

            // Load base data
            Object.assign(this.visualizationData, {
                ...this.selectedVisualization,
                connectionType: this.selectedVisualization.targetDataset ? 'join' : 'single'
            })

            // Load visualization type
            if (this.selectedVisualization.type) {
                // Convert 'pies' to 'charts' for wizard UI
                this.selectedVisualizationType = this.selectedVisualization.type === 'pies' ? 'charts' : this.selectedVisualization.type
            }

            // Load type-specific configuration
            if (this.selectedVisualization.analysisConf) {
                const conf = this.selectedVisualization.analysisConf
                this.visualizationConfig.classificationMethod = conf.method || 'CLASSIFY_BY_EQUAL_INTERVALS'
                this.visualizationConfig.numberOfClasses = conf.classes || 5
                if (conf.style) {
                    this.visualizationConfig.fromColor = conf.style.color || 'rgba(59, 130, 246, 1)'
                    this.visualizationConfig.toColor = conf.style.toColor || 'rgba(236, 72, 153, 1)'
                    this.visualizationConfig.borderColor = conf.style.borderColor || 'rgba(255, 255, 255, 1)'
                }
                this.visualizationConfig.borderWidth = conf.borderWidth || 1
            }

            if (this.selectedVisualization.markerConf) {
                const conf = this.selectedVisualization.markerConf
                const normalizedType = conf.type === 'circle' ? 'default' : conf.type === 'image' ? 'img' : conf.type
                this.visualizationConfig.markerType = normalizedType || 'default'
                this.visualizationConfig.markerSize = conf.size || 20
                this.visualizationConfig.opacity = conf.opacity || 75

                // Load icon/img/url based on type
                if (conf.icon?.className) {
                    this.visualizationConfig.iconClass = conf.icon.className
                }
                if (conf.img) {
                    this.visualizationConfig.iconImg = conf.img
                }
                if (conf.url) {
                    this.visualizationConfig.iconUrl = conf.url
                }

                if (conf.style) {
                    this.visualizationConfig.fromColor = conf.style.color || 'rgba(59, 130, 246, 1)'
                }
            }

            if (this.selectedVisualization.pieConf) {
                const conf = this.selectedVisualization.pieConf
                // Convert 'pie' → 'pies' for UI consistency
                this.visualizationConfig.chartType = conf.type === 'pie' ? 'pies' : 'bar'
                // Load chartMeasures if available
                if (this.selectedVisualization.chartMeasures) {
                    this.visualizationData.chartMeasures = this.selectedVisualization.chartMeasures
                } else if (conf.measures) {
                    this.visualizationData.chartMeasures = conf.measures
                }
            }

            if (this.selectedVisualization.balloonConf) {
                const conf = this.selectedVisualization.balloonConf
                this.visualizationConfig.classificationMethod = conf.method || 'CLASSIFY_BY_EQUAL_INTERVALS'
                this.visualizationConfig.numberOfClasses = conf.classes || 5
                if (conf.style) {
                    this.visualizationConfig.fromColor = conf.style.color || 'rgba(59, 130, 246, 1)'
                }
            }

            if (this.selectedVisualization.heatmapConf) {
                const conf = this.selectedVisualization.heatmapConf
                this.visualizationConfig.heatmapRadius = conf.radius || 25
                this.visualizationConfig.heatmapBlur = conf.blur || 15
                this.visualizationConfig.heatmapMaxZoom = conf.maxZoom || 1
            }

            if (this.selectedVisualization.clusterConf) {
                this.visualizationConfig.clusterRadius = this.selectedVisualization.clusterConf.clusterRadius || 40
                if (this.selectedVisualization.clusterConf.style) {
                    this.visualizationConfig.fromColor = this.selectedVisualization.clusterConf.style.color || 'rgba(59, 130, 246, 1)'
                }
            }
        },
        getSelectedLayerType() {
            if (!this.visualizationData.target) return 'dataset'
            const targetLayer = this.widgetModel.layers?.find((layer: any) => this.visualizationData.target === layer.layerId)
            return targetLayer ? targetLayer.type : 'dataset'
        },
        setConnectionType(value: string) {
            this.visualizationData.connectionType = value as 'single' | 'join'
            this.onConnectionTypeChange()
        },
        onConnectionTypeChange() {
            // Reset fields when connection type changes
            this.visualizationData.targetDataset = undefined
            this.visualizationData.targetMeasure = undefined
            this.visualizationData.targetProperty = null
            this.visualizationData.targetDatasetForeignKeyColumn = undefined
        },
        availableMeasuresForSingle() {
            if (!this.visualizationData.target) return []
            const selectedLayer = this.widgetModel.layers?.find((layer: any) => layer.layerId === this.visualizationData.target)
            if (!selectedLayer) return []
            return selectedLayer.columns?.filter((col: any) => col.fieldType === 'MEASURE') || []
        },
        loadLayersOptions() {
            this.availableLayersOptions = this.widgetModel?.layers
                ? this.widgetModel.layers.map((layer: any) => {
                      return { layerId: layer.layerId, name: layer.name }
                  })
                : []
        },
        loadLayerConfig() {
            if (this.layer) {
                this.layerConfig.name = this.layer.name || ''
                // Load other configuration from layer
            }
        },
        availableMeasures(dsId: string) {
            const targetDataset = this.availableDatasets.find((layer: any) => dsId === layer.layerId)
            return targetDataset ? targetDataset.columns.filter((column: any) => column.fieldType === 'MEASURE') : []
        },
        availableTargetDatasetColumns(dsId: string) {
            const targetDataset = this.availableDatasets.find((layer: any) => dsId === layer.layerId)
            return targetDataset ? [...targetDataset.columns] : []
        },
        availableChartMeasures(id: string) {
            const targetDataset = this.availableDatasets.find((layer: any) => id === layer.name || id === layer.layerId)
            if (targetDataset) return targetDataset.columns.filter((column: any) => column.fieldType === 'MEASURE')

            const targetLayer = this.widgetModel.layers?.find((layer: any) => id === layer.layerId)
            if (targetLayer && this.propertiesCache.has(targetLayer.layerId)) return this.propertiesCache.get(targetLayer.layerId)

            return []
        },
        async loadAvailableProperties(targetId: string) {
            if (!targetId) return

            if (this.propertiesCache.has(targetId)) {
                this.visualizationData.properties = this.propertiesCache.get(targetId) || []
                return
            }

            const targetLayer = this.widgetModel.layers?.find((layer: any) => targetId === layer.layerId)
            if (targetLayer?.type === 'layer') {
                this.setLoading(true)
                const properties = await getPropertiesByLayerLabel(targetLayer.label, undefined)
                this.setLoading(false)
                this.propertiesCache.set(targetLayer.layerId, properties)
                this.visualizationData.properties = properties
            }
        },
        async onTargetChange(id: string) {
            this.visualizationData.targetDataset = undefined
            this.visualizationData.targetMeasure = undefined
            this.visualizationData.targetProperty = null
            this.visualizationData.targetType = 'column'
            this.visualizationData.targetDatasetForeignKeyColumn = undefined
            this.visualizationData.chartMeasures = []
            this.visualizationData.targetDatasetMeasures = []

            const target = this.widgetModel.layers?.find((layer: any) => id === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(id)) {
                this.visualizationData.properties = this.propertiesCache.get(id) || []
                return
            }
            await this.loadAvailableProperties(id)
        },
        onDataLinkChange(dataLinkType: 'column' | 'property') {
            this.visualizationData.targetProperty = null
            this.visualizationData.targetDatasetForeignKeyColumn = undefined
            if (dataLinkType === 'property') {
                this.visualizationData.targetDataset = undefined
            }
        },
        getTargetLayerType() {
            const targetLayer = this.widgetModel.layers?.find((layer: any) => this.visualizationData.target === layer.layerId)
            return targetLayer ? targetLayer.type : 'dataset'
        },
        closeDialog() {
            this.currentStep = 1
            this.$emit('close')
        },
        onIconSelected(icon: any) {
            this.visualizationConfig.iconClass = icon.className
            this.iconPickerVisible = false
        },
        onImageSelected(image: any) {
            if (!image) return
            this.visualizationConfig.iconImg = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services` + image.url
            this.imagePickerVisible = false
        },
        saveConfiguration() {
            // Debug logging for charts
            if (this.selectedVisualizationType === 'charts') {
                console.log('🔍 CHARTS DEBUG - Saving configuration:')
                console.log('chartMeasures:', this.visualizationData.chartMeasures)
                console.log('connectionType:', this.visualizationData.connectionType)
                console.log('target:', this.visualizationData.target)
                console.log('targetDataset:', this.visualizationData.targetDataset)
            }

            // Build proper configuration structure based on visualization type
            const baseConfig: any = {
                ...this.visualizationData,
                // For charts, use 'pies' as the type for map rendering compatibility
                type: this.selectedVisualizationType === 'charts' ? 'pies' : this.selectedVisualizationType
            }

            // Add type-specific configuration
            if (this.selectedVisualizationType === 'choropleth') {
                baseConfig.analysisConf = {
                    method: this.visualizationConfig.classificationMethod,
                    classes: this.visualizationConfig.numberOfClasses,
                    style: {
                        color: this.visualizationConfig.fromColor,
                        toColor: this.visualizationConfig.toColor,
                        borderColor: this.visualizationConfig.borderColor
                    },
                    borderWidth: this.visualizationConfig.borderWidth
                }
            } else if (this.selectedVisualizationType === 'markers') {
                baseConfig.markerConf = {
                    type: this.visualizationConfig.markerType,
                    style: {
                        color: this.visualizationConfig.fromColor
                    },
                    size: this.visualizationConfig.markerSize,
                    opacity: this.visualizationConfig.opacity
                }

                // Add icon/img/url based on marker type
                if (this.visualizationConfig.markerType === 'icon') {
                    baseConfig.markerConf.icon = {
                        className: this.visualizationConfig.iconClass || 'fa fa-map-marker'
                    }
                } else if (this.visualizationConfig.markerType === 'img') {
                    baseConfig.markerConf.img = this.visualizationConfig.iconImg || ''
                } else if (this.visualizationConfig.markerType === 'url') {
                    baseConfig.markerConf.url = this.visualizationConfig.iconUrl || ''
                }
            } else if (this.selectedVisualizationType === 'charts') {
                baseConfig.pieConf = {
                    type: this.visualizationConfig.chartType === 'pies' ? 'pie' : 'bar',
                    measures: this.visualizationData.chartMeasures || [],
                    colors: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 158, 11, 1)', 'rgba(139, 92, 246, 1)', 'rgba(236, 252, 203, 1)']
                }
                // Store chartMeasures at root level for easy access
                baseConfig.chartMeasures = this.visualizationData.chartMeasures
                // Also store in targetDatasetMeasures if in join mode for compatibility
                if (this.visualizationData.connectionType === 'join' && this.visualizationData.targetDataset) {
                    baseConfig.targetDatasetMeasures = this.visualizationData.chartMeasures
                }
            } else if (this.selectedVisualizationType === 'balloons') {
                baseConfig.balloonConf = {
                    method: this.visualizationConfig.classificationMethod || 'CLASSIFY_BY_EQUAL_INTERVALS',
                    classes: this.visualizationConfig.numberOfClasses || 5,
                    minSize: 10,
                    maxSize: 40,
                    style: {
                        color: this.visualizationConfig.fromColor
                    }
                }
            } else if (this.selectedVisualizationType === 'heatmap') {
                console.log('🔥 HEATMAP DEBUG - Saving configuration:')
                console.log('targetMeasure:', this.visualizationData.targetMeasure)
                console.log('targetProperty:', this.visualizationData.targetProperty)
                console.log('target:', this.visualizationData.target)

                baseConfig.heatmapConf = {
                    radius: this.visualizationConfig.heatmapRadius || 25,
                    blur: this.visualizationConfig.heatmapBlur || 15,
                    maxZoom: this.visualizationConfig.heatmapMaxZoom || 1
                }
            } else if (this.selectedVisualizationType === 'clusters') {
                baseConfig.clusterConf = {
                    clusterRadius: this.visualizationConfig.clusterRadius,
                    style: {
                        color: this.visualizationConfig.fromColor
                    }
                }
            }

            // Final debug log for charts
            if (this.selectedVisualizationType === 'charts') {
                console.log('📦 FINAL baseConfig being saved:', JSON.stringify(baseConfig, null, 2))
            }

            this.$emit('save', baseConfig)
            this.closeDialog()
        }
    }
})
</script>

<style lang="scss" scoped>
.layer-wizard-card {
    background: #ffffff;
    color: #212529;
    display: flex;
    flex-direction: column;
    height: 90vh;
    max-height: 900px;
    width: 75vw;
    max-width: 1600px;
    min-width: 800px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
}

.wizard-header {
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .header-content {
        h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #212529;
        }

        .subtitle {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
    }

    :deep(.q-btn) {
        color: #6c757d;

        &:hover {
            color: #212529;
            background: #e9ecef;
        }
    }
}

.stepper-nav {
    padding: 24px 32px;
    background: #ffffff;

    .steps {
        display: flex;
        align-items: center;
        max-width: 600px;
    }

    .step {
        display: flex;
        align-items: center;
        gap: 12px;

        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #e9ecef;
            color: #adb5bd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .step-label {
            color: #6c757d;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        &.active {
            .step-number {
                background: var(--kn-color-fab);
                color: #fff;
            }

            .step-label {
                color: var(--kn-color-fab);
            }
        }

        &.completed {
            .step-number {
                background: var(--kn-color-fab);
                color: #fff;
            }

            .step-label {
                color: var(--kn-color-fab);
            }
        }
    }

    .step-divider {
        flex: 1;
        height: 2px;
        background: #e9ecef;
        margin: 0 16px;
    }
}

.wizard-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    background: #f8f9fa;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: #ced4da;
        border-radius: 4px;

        &:hover {
            background: #adb5bd;
        }
    }
}

.step-content {
    max-width: 900px;
    margin: 0 auto;
}

.config-section {
    margin-bottom: 24px;

    .layer-name-input {
        :deep(.q-field__control) {
            background: #ffffff;
            border-radius: 8px;

            &::before {
                border-color: #e9ecef;
            }

            &:hover::before {
                border-color: #ced4da;
            }
        }

        :deep(input) {
            color: #212529;
        }

        :deep(.q-field__label) {
            color: #6c757d;
        }

        :deep(.q-field__bottom) {
            color: #6c757d;
        }
    }
}

.config-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
}

/* Three-column row utility for choropleth layout */
.three-col-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    align-items: center;
}

@media (max-width: 900px) {
    .three-col-row {
        grid-template-columns: 1fr;
    }
}

.data-join .join-field :deep(.q-field__control),
.data-join :deep(.q-field__control) {
    padding: 6px 8px;
    min-height: 36px;
}

/* Data join container: show join fields and icon inline */
.data-join {
    padding: 12px;
}

.data-join .data-join-container {
    display: flex;
    gap: 8px;
    align-items: center;
}

.data-join .join-field {
    flex: 1 1 45%;
}

.data-join .join-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

/* When screen is narrow stack the join fields vertically */
@media (max-width: 640px) {
    .data-join .data-join-container {
        flex-direction: column;
        gap: 12px;
    }
    .data-join .join-icon {
        width: 100%;
        height: 40px;
    }
}

.connection-type-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.connection-card {
    padding: 24px;
    background: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    .q-icon:first-child {
        color: #adb5bd;
        margin-bottom: 16px;
    }

    .card-title {
        font-weight: 600;
        color: #212529;
        margin-bottom: 8px;
        font-size: 16px;
    }

    .card-description {
        font-size: 13px;
        color: #6c757d;
        line-height: 1.5;
    }

    .check-icon {
        position: absolute;
        top: 16px;
        right: 16px;
        color: var(--kn-color-fab);
    }

    &:hover {
        border-color: color-mix(in srgb, var(--kn-color-fab), transparent 70%);
        background: #f8f9fa;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &.selected {
        border-color: var(--kn-color-fab);
        background: color-mix(in srgb, var(--kn-color-fab), transparent 95%);

        .q-icon:first-child {
            color: var(--kn-color-fab);
        }
    }
}


.wizard-footer {
    padding: 16px 32px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;

    .q-btn {
        text-transform: none;
        font-weight: 500;
        padding: 8px 24px;
    }
}

.viz-section {
    h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #212529;
    }

    .section-description {
        margin: 0 0 32px 0;
        color: #6c757d;
    }
}

.section-label {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: #212529;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.field-label {
    display: block;
    font-weight: 500;
    font-size: 14px;
    color: #495057;
    margin-bottom: 8px;
}

.viz-type-section {
    margin-bottom: 32px;
}

.chart-type-section {
    margin-bottom: 32px;
}

.viz-type-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.chart-type-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.viz-type-card,
.chart-type-option {
    padding: 20px;
    background: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: center;

    .q-icon:first-child {
        color: #adb5bd;
        margin-bottom: 12px;
    }

    span {
        display: block;
        font-weight: 500;
        color: #212529;
        margin-top: 8px;
    }

    .card-title {
        font-weight: 600;
        color: #212529;
        margin-bottom: 6px;
        font-size: 15px;
    }

    .card-description {
        font-size: 12px;
        color: #6c757d;
        line-height: 1.4;
    }

    .check-icon {
        position: absolute;
        top: 12px;
        right: 12px;
        color: var(--kn-color-fab);
    }

    &:hover {
        border-color: color-mix(in srgb, var(--kn-color-fab), transparent 70%);
        background: #f8f9fa;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &.selected {
        border-color: var(--kn-color-fab);
        background: color-mix(in srgb, var(--kn-color-fab), transparent 95%);

        .q-icon:first-child {
            color: var(--kn-color-fab);
        }
    }
}

.color-config-section,
.marker-config-section,
.style-config-section {
    margin-bottom: 32px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
}

.color-pickers-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}


.slider-control {
    margin-bottom: 16px;

    :deep(.q-slider) {
        margin-top: 24px;
    }
}


.cluster-config {
    margin-top: 16px;
}

.heatmap-config-section {
    margin-top: 32px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
}

.marker-config-section,
.balloon-config-section,
.cluster-config-section {
    margin-top: 32px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
}

/* Ensure markers controls can use the full width inside the marker-config-section
   (previously the controls were constrained by a surrounding grid) */
.marker-config-section .markers-controls {
    width: 100% !important;
    display: block;
}

.marker-config-section .three-col-row {
    /* force the three columns to span the full available width */
    grid-template-columns: repeat(3, 1fr);
}

/* If marker-config-section lives inside a grid parent, force it to span all columns */
.marker-config-section {
    grid-column: 1 / -1 !important;
    width: 100% !important;
}

.color-pickers-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
}


.slider-control {
    margin-bottom: 16px;

    :deep(.q-slider) {
        margin-top: 24px;
    }
}


.cluster-config {
    margin-top: 16px;
}

.heatmap-config-section {
    margin-top: 32px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
}

.marker-config-section,
.balloon-config-section,
.cluster-config-section {
    margin-top: 32px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
}

.show-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #ffffff;
    border-radius: 8px;

    .show-label {
        font-weight: 500;
        color: #495057;
        margin: 0;
    }
}

/* Inline picker container used next to color pickers for icon/img markers */
.picker-inline {
    display: flex;
    gap: 8px;
    align-items: center;
}
.picker-inline :deep(.q-input) {
    flex: 1 1 auto;
}
.picker-inline :deep(.q-btn) {
    flex: 0 0 auto;
}

/* Data connection row: label, measure/property, show toggle on same row */
.data-connection-row {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 24px;

    .layer-name-input {
        grid-column: 1 / 2;
    }

    .show-toggle-wrapper {
        grid-column: 3 / 4;
        justify-self: flex-end;
    }

    /* Measures / Property selector */
    :deep(.q-select) {
        width: 100%;
    }
}


/* Reduce gap when label row is directly above the data-join section to avoid big empty space */
.config-section.data-join {
      /* Reduce top spacing for the join box to keep the UI compact.
         Applied globally to the data-join section so it works regardless
         of intermediate wrapper elements in the template. */
      margin-top: 8px;
 }

.join-compact-row .label-with-toggle {
     /* Keep label and toggle on the same row, prevent wrapping */
     display: flex;
     flex-direction: row;
     align-items: center;
     gap: 8px;
     width: 100%;
     flex-wrap: nowrap;
 }

.join-compact-row .label-with-toggle .inline-toggle {
     /* Keep toggle compact and prevent it from growing */
     flex: 0 0 auto;
     display: flex;
     align-items: center;
     gap: 6px;
 }

.join-compact-row .label-with-toggle :deep(.q-field__control) {
     /* Make sure the inner control aligns vertically */
     height: 40px !important;
     display: flex !important;
     align-items: center !important;
 }

/* Stronger fallback: reserve a fixed width for the toggle to prevent wrapping
   in tight containers by making the input calculate available space. */
.join-compact-row .label-with-toggle .inline-toggle {
    width: 110px !important; /* fits label + toggle control */
    justify-content: flex-end;
}

.join-compact-row .label-with-toggle .layer-name-input {
    flex: 1 1 auto !important;
    min-width: 0 !important; /* critical to allow shrinking */
    width: auto !important;
}

.join-compact-row .label-with-toggle :deep(.q-input__control),
.join-compact-row .label-with-toggle :deep(.q-field__control) {
    padding-right: 8px !important;
}
</style>

<style lang="scss">
/* Global styles for dialog positioning */
.wizard-overlay-dialog {
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 60% !important;
    max-width: none !important;
    margin: 0 !important;

    .q-dialog__inner {
        justify-content: flex-end !important;
        align-items: stretch !important;
        padding: 0 !important;
        max-width: none !important;
    }

    .q-dialog__backdrop {
        background: rgba(0, 0, 0, 0.3) !important;
    }
}
</style>

