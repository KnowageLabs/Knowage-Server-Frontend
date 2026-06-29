<template>
    <q-card class="q-ma-sm">
        <!-- Header bar -->
        <div class="viz-list-header row items-center q-px-md">
            <span class="text-subtitle2 text-weight-medium">{{ $t('dashboard.widgetEditor.map.visualizationType') }}</span>
            <q-space />
            <q-btn flat round dense icon="add" color="primary" @click="addVisualization">
                <q-tooltip>{{ $t('dashboard.widgetEditor.map.addVisualization') }}</q-tooltip>
            </q-btn>
        </div>
        <q-separator />

        <div class="q-px-md q-py-xs">
            <!-- Dropzone 0 -->
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>

            <div v-for="(viz, index) in visualizations" :key="viz.id ?? index">
                <div class="viz-row" :class="{ 'viz-row--expanded': activeIndex === index }">
                    <!-- Header -->
                    <div class="viz-row-header row no-wrap">
                        <div class="kn-drag-handle row items-center justify-center" draggable="true" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                            <q-icon name="drag_indicator" size="xs" color="primary" />
                        </div>
                        <div class="col row no-wrap items-center q-px-sm q-py-xs cursor-pointer overflow-hidden" @click="toggleExpansion(index)">
                            <q-icon :name="getVisualizationIcon(viz.type)" size="xs" color="primary" class="q-mr-xs flex-shrink-0" />
                            <span class="text-weight-bold text-body2 q-mr-sm text-no-wrap">{{ viz.label || '(' + getVisualizationTypeLabel(viz.type) + ')' }}</span>
                            <span class="text-caption text-grey-6 text-no-wrap">{{ getVisualizationTypeLabel(viz.type) }}</span>
                            <template v-if="viz.target">
                                <span class="text-caption text-grey-4 q-mx-xs flex-shrink-0">�</span>
                                <span class="viz-meta-label">{{ $t('common.dataset') }}:</span>
                                <span class="text-caption text-grey-7 q-ml-xs q-mr-xs text-no-wrap">{{ getTargetName(viz.target) }}</span>
                            </template>
                            <template v-if="viz.targetMeasure">
                                <span class="text-caption text-grey-4 q-mx-xs flex-shrink-0">�</span>
                                <span class="viz-meta-label">{{ $t('common.measure') }}:</span>
                                <span class="text-caption text-grey-7 q-ml-xs text-no-wrap">{{ viz.targetMeasure }}</span>
                            </template>
                            <div class="row items-center no-wrap q-ml-auto" style="gap: 2px; flex-shrink: 0; padding-left: 6px">
                                <template v-if="getVisualizationColors(viz).length">
                                    <div v-for="(color, ci) in getVisualizationColors(viz).slice(0, 5)" :key="ci" class="color-dot" :style="{ background: color }"></div>
                                </template>
                                <q-btn flat round dense :icon="viz.visible ? 'visibility' : 'visibility_off'" size="sm" color="grey-6" @click.stop="viz.visible = !viz.visible" />
                            </div>
                        </div>
                        <div class="kn-action-handle row items-center justify-center">
                            <q-btn flat round dense icon="delete" size="sm" color="grey-6" @click.stop="confirmDelete(viz, index)" />
                        </div>
                    </div>

                    <!-- Expanded form -->
                    <Transition name="viz-expand">
                        <div v-if="activeIndex === index" class="viz-form">
                            <!-- Name + Type row -->
                            <div class="row q-col-gutter-sm q-pa-sm">
                                <div class="col-6">
                                    <q-input outlined dense v-model="viz.label" :label="$t('common.name')" />
                                </div>
                                <div class="col-6">
                                    <q-select outlined dense v-model="viz.type" :options="visTypeOptions" emit-value map-options option-label="label" option-value="value" :label="$t('dashboard.widgetEditor.map.selectVisualizationType')" @update:model-value="onTypeChange(viz)">
                                        <template #prepend><q-icon :name="getVisualizationIcon(viz.type)" /></template>
                                        <template #option="scope">
                                            <q-item v-bind="scope.itemProps">
                                                <q-item-section avatar><q-icon :name="scope.opt.icon" /></q-item-section>
                                                <q-item-section>{{ scope.opt.label }}</q-item-section>
                                            </q-item>
                                        </template>
                                    </q-select>
                                </div>
                            </div>

                            <!-- CHOROPLETH -->
                            <template v-if="viz.type === 'choropleth' && viz.analysisConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.styleConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col">
                                        <WidgetEditorColorPicker :initial-value="viz.analysisConf.style.color" :label="$t('dashboard.widgetEditor.map.fromColor')" @change="viz.analysisConf.style.color = $event" />
                                    </div>
                                    <div v-if="viz.analysisConf.method !== 'CLASSIFY_BY_RANGES'" class="col">
                                        <WidgetEditorColorPicker :initial-value="viz.analysisConf.style.toColor" :label="$t('dashboard.widgetEditor.map.toColor')" @change="viz.analysisConf.style.toColor = $event" />
                                    </div>
                                    <div class="col">
                                        <WidgetEditorColorPicker :initial-value="viz.analysisConf.style.borderColor" :label="$t('dashboard.widgetEditor.map.borderColor')" @change="viz.analysisConf.style.borderColor = $event" />
                                    </div>
                                </div>
                                <div class="row q-col-gutter-sm q-px-sm q-pb-sm">
                                    <div class="col">
                                        <q-select outlined dense v-model="viz.analysisConf.method" :options="classificationMethodOptions" emit-value map-options :label="$t('dashboard.widgetEditor.map.classesMethodOptions.title')">
                                            <template #option="scope">
                                                <q-item v-bind="scope.itemProps">
                                                    <q-item-section>{{ $t(scope.opt.label) }}</q-item-section>
                                                </q-item></template
                                            >
                                            <template #selected-item="scope">{{ scope.opt ? $t(scope.opt.label) : '' }}</template>
                                        </q-select>
                                    </div>
                                    <div v-if="viz.analysisConf.method !== 'CLASSIFY_BY_RANGES'" class="col">
                                        <q-input outlined dense type="number" v-model.number="viz.analysisConf.classes" :label="$t('dashboard.widgetEditor.map.numberOfClasses')" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense type="number" v-model.number="viz.analysisConf.style.borderWidth" :label="$t('dashboard.widgetEditor.map.borderWidth')" />
                                    </div>
                                </div>
                                <template v-if="viz.analysisConf.method === 'CLASSIFY_BY_RANGES'">
                                    <div class="section-label row items-center">
                                        <span>{{ $t('dashboard.widgetEditor.thresholds') }}</span>
                                        <q-btn flat round dense icon="add" size="xs" class="q-ml-auto" @click="addThreshold(ensureThresholds(viz.analysisConf))" />
                                    </div>
                                    <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDraggingThreshold, 'kn-dropzone-active': isActiveThresholdDropzone(viz.id + '', 0) }" @drop.stop="onThresholdDrop($event, viz.id + '', ensureThresholds(viz.analysisConf), 0)" @dragover.prevent @dragenter.prevent="activeThresholdDropzone = { vizId: viz.id + '', index: 0 }" @dragleave.prevent="activeThresholdDropzone = null"></div>
                                    <div v-for="(threshold, ti) in ensureThresholds(viz.analysisConf)" :key="ti" class="q-px-sm">
                                        <div class="column-type-row row no-wrap">
                                            <div class="kn-drag-handle row items-center justify-center" draggable="true" @dragstart.stop="onThresholdDragStart($event, viz.id + '', ti)" @dragend="isDraggingThreshold = false">
                                                <q-icon name="drag_indicator" size="xs" />
                                            </div>
                                            <div class="col q-pa-sm">
                                                <div class="row q-col-gutter-sm">
                                                    <div class="col-4"><WidgetEditorColorPicker :initial-value="threshold.color" :label="$t('common.color')" @change="threshold.color = $event" /></div>
                                                    <div class="col-4"><q-input outlined dense type="number" v-model.number="threshold.from" :label="$t('dashboard.widgetEditor.map.fromThreshold')" /></div>
                                                    <div class="col-4"><q-input outlined dense type="number" v-model.number="threshold.to" :label="$t('dashboard.widgetEditor.map.toThreshold')" /></div>
                                                </div>
                                            </div>
                                            <div class="kn-action-handle row items-center justify-center">
                                                <q-btn flat round dense icon="delete" size="sm" @click="deleteThreshold(ensureThresholds(viz.analysisConf), ti)" />
                                            </div>
                                        </div>
                                        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDraggingThreshold, 'kn-dropzone-active': isActiveThresholdDropzone(viz.id + '', ti + 1) }" @drop.stop="onThresholdDrop($event, viz.id + '', ensureThresholds(viz.analysisConf), ti + 1)" @dragover.prevent @dragenter.prevent="activeThresholdDropzone = { vizId: viz.id + '', index: ti + 1 }" @dragleave.prevent="activeThresholdDropzone = null"></div>
                                    </div>
                                </template>
                            </template>

                            <!-- BALLOONS -->
                            <template v-if="viz.type === 'balloons' && viz.balloonConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.styleConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col">
                                        <q-select outlined dense v-model="viz.balloonConf.method" :options="classificationMethodOptions" emit-value map-options :label="$t('dashboard.widgetEditor.map.classesMethodOptions.title')">
                                            <template #option="scope"
                                                ><q-item v-bind="scope.itemProps"
                                                    ><q-item-section>{{ $t(scope.opt.label) }}</q-item-section></q-item
                                                ></template
                                            >
                                            <template #selected-item="scope">{{ scope.opt ? $t(scope.opt.label) : '' }}</template>
                                        </q-select>
                                    </div>
                                    <div v-if="viz.balloonConf.method !== 'CLASSIFY_BY_RANGES'" class="col">
                                        <q-input outlined dense type="number" v-model.number="viz.balloonConf.classes" :label="$t('dashboard.widgetEditor.map.numberOfClasses')" />
                                    </div>
                                    <div class="col">
                                        <WidgetEditorColorPicker :initial-value="viz.balloonConf.style.color" :label="$t('common.color')" @change="viz.balloonConf.style.color = $event" />
                                    </div>
                                </div>
                                <template v-if="viz.balloonConf.method === 'CLASSIFY_BY_RANGES'">
                                    <div class="section-label row items-center">
                                        <span>{{ $t('dashboard.widgetEditor.thresholds') }}</span>
                                        <q-btn flat round dense icon="add" size="xs" class="q-ml-xs" @click="addThreshold(ensureThresholds(viz.balloonConf))" />
                                    </div>
                                    <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDraggingThreshold, 'kn-dropzone-active': isActiveThresholdDropzone(viz.id + '_b', 0) }" @drop.stop="onThresholdDrop($event, viz.id + '_b', ensureThresholds(viz.balloonConf), 0)" @dragover.prevent @dragenter.prevent="activeThresholdDropzone = { vizId: viz.id + '_b', index: 0 }" @dragleave.prevent="activeThresholdDropzone = null"></div>
                                    <div v-for="(threshold, ti) in ensureThresholds(viz.balloonConf)" :key="ti" class="q-px-sm">
                                        <div class="column-type-row row no-wrap">
                                            <div class="kn-drag-handle row items-center justify-center" draggable="true" @dragstart.stop="onThresholdDragStart($event, viz.id + '_b', ti)" @dragend="isDraggingThreshold = false">
                                                <q-icon name="drag_indicator" size="xs" />
                                            </div>
                                            <div class="col q-pa-sm">
                                                <div class="row q-col-gutter-sm">
                                                    <div class="col-4"><WidgetEditorColorPicker :initial-value="threshold.color" :label="$t('common.color')" @change="threshold.color = $event" /></div>
                                                    <div class="col-4"><q-input outlined dense type="number" v-model.number="threshold.from" :label="$t('dashboard.widgetEditor.map.fromThreshold')" /></div>
                                                    <div class="col-4"><q-input outlined dense type="number" v-model.number="threshold.to" :label="$t('dashboard.widgetEditor.map.toThreshold')" /></div>
                                                </div>
                                            </div>
                                            <div class="kn-action-handle row items-center justify-center">
                                                <q-btn flat round dense icon="delete" size="sm" @click="deleteThreshold(ensureThresholds(viz.balloonConf), ti)" />
                                            </div>
                                        </div>
                                        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDraggingThreshold, 'kn-dropzone-active': isActiveThresholdDropzone(viz.id + '_b', ti + 1) }" @drop.stop="onThresholdDrop($event, viz.id + '_b', ensureThresholds(viz.balloonConf), ti + 1)" @dragover.prevent @dragenter.prevent="activeThresholdDropzone = { vizId: viz.id + '_b', index: ti + 1 }" @dragleave.prevent="activeThresholdDropzone = null"></div>
                                    </div>
                                </template>
                            </template>

                            <!-- HEATMAP -->
                            <template v-if="viz.type === 'heatmap' && viz.heatmapConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.styleConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col"><q-input outlined dense type="number" v-model.number="viz.heatmapConf.radius" :label="$t('dashboard.widgetEditor.map.heatmapRadius')" /></div>
                                    <div class="col"><q-input outlined dense type="number" v-model.number="viz.heatmapConf.blur" :label="$t('dashboard.widgetEditor.map.heatmapBlur')" /></div>
                                    <div class="col"><q-input outlined dense type="number" v-model.number="viz.heatmapConf.maxZoom" :label="$t('dashboard.widgetEditor.map.heatmapMaxZoom')" /></div>
                                </div>
                            </template>

                            <!-- MARKERS & CLUSTERS � shared marker config -->
                            <template v-if="(viz.type === 'markers' || viz.type === 'clusters') && viz.markerConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.markerConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col">
                                        <q-select outlined dense v-model="viz.markerConf.type" :options="markerTypeOptions" emit-value map-options option-label="label" option-value="value" :label="$t('dashboard.widgetEditor.map.markerType')">
                                            <template #selected-item="scope">{{ scope.opt ? $t(scope.opt.label) : '' }}</template>
                                            <template #option="scope">
                                                <q-item v-bind="scope.itemProps">
                                                    <q-item-section>{{ $t(scope.opt.label) }}</q-item-section>
                                                </q-item>
                                            </template>
                                        </q-select>
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense type="number" v-model.number="viz.markerConf.size" :label="$t('dashboard.widgetEditor.map.markerSize')" />
                                    </div>
                                    <div v-if="viz.markerConf.type === 'default' || viz.markerConf.type === 'icon'" class="col">
                                        <WidgetEditorColorPicker :initial-value="viz.markerConf.style.color" :label="$t('common.color')" @change="viz.markerConf.style.color = $event" />
                                    </div>
                                </div>
                                <div v-if="viz.markerConf.type === 'icon'" class="row q-col-gutter-sm q-px-sm q-pb-sm">
                                    <div class="col">
                                        <q-input outlined dense readonly :model-value="viz.markerConf.icon?.className || 'fas fa-map-marker'" :label="$t('dashboard.widgetEditor.iconTooltips.iconPicker')">
                                            <template #prepend>
                                                <i :class="viz.markerConf.icon?.className || 'fas fa-map-marker'" style="font-size: 1rem" />
                                            </template>
                                            <template #append>
                                                <q-icon name="search" class="cursor-pointer" @click.stop="iconPickerVizId = viz.id ?? null" />
                                            </template>
                                        </q-input>
                                    </div>
                                </div>
                                <div v-else-if="viz.markerConf.type === 'img'" class="row q-col-gutter-sm q-px-sm q-pb-sm">
                                    <div class="col">
                                        <q-input outlined dense readonly :model-value="viz.markerConf.img || ''" :label="$t('dashboard.widgetEditor.map.imageUrl')">
                                            <template #append>
                                                <q-icon name="collections" class="cursor-pointer" @click.stop="imagePickerVizId = viz.id ?? null" />
                                            </template>
                                        </q-input>
                                    </div>
                                </div>
                                <div v-else-if="viz.markerConf.type === 'url'" class="row q-col-gutter-sm q-px-sm q-pb-sm">
                                    <div class="col"><q-input outlined dense v-model="viz.markerConf.url" :label="$t('dashboard.widgetEditor.map.markerTypes.iconUrl')" /></div>
                                </div>
                            </template>

                            <!-- CLUSTERS � extra cluster config -->
                            <template v-if="viz.type === 'clusters' && viz.clusterConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.clusterConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col"><q-input outlined dense type="number" v-model.number="viz.clusterConf.maxClusterRadius" :label="$t('dashboard.widgetEditor.map.maxClusterRadius')" /></div>
                                    <div class="col"><q-input outlined dense v-model="viz.clusterConf.style['font-size']" :label="$t('dashboard.widgetEditor.iconTooltips.fontSize')" /></div>
                                    <div class="col"><WidgetEditorColorPicker :initial-value="viz.clusterConf.style['background-color']" :label="$t('dashboard.widgetEditor.iconTooltips.backgroundColor')" @change="viz.clusterConf.style['background-color'] = $event" /></div>
                                    <div class="col"><WidgetEditorColorPicker :initial-value="viz.clusterConf.style.color" :label="$t('dashboard.widgetEditor.iconTooltips.fontColor')" @change="viz.clusterConf.style.color = $event" /></div>
                                </div>
                            </template>

                            <!-- PIES/CHARTS -->
                            <template v-if="viz.type === 'pies' && viz.pieConf">
                                <div class="section-label">{{ $t('dashboard.widgetEditor.map.styleConfiguration') }}</div>
                                <div class="row q-col-gutter-sm q-pa-sm">
                                    <div class="col">
                                        <q-select outlined dense v-model="viz.pieConf.type" :options="chartTypeOptions" emit-value map-options option-label="label" option-value="value" :label="$t('dashboard.widgetEditor.map.chartType')">
                                            <template #selected-item="scope">{{ scope.opt ? $t(scope.opt.label) : '' }}</template>
                                            <template #option="scope">
                                                <q-item v-bind="scope.itemProps">
                                                    <q-item-section>{{ $t(scope.opt.label) }}</q-item-section>
                                                </q-item>
                                            </template>
                                        </q-select>
                                    </div>
                                </div>
                                <MapChartColorPicker v-model="viz.pieConf.colors" style="margin: 0 -8px -8px" />
                            </template>

                            <!-- DATA CONNECTION -->

                            <div class="section-label">{{ $t('dashboard.widgetEditor.map.dataConnection') }}</div>
                            <div class="q-pa-sm">
                                <q-select outlined dense v-model="viz.target" :options="availableLayersOptions" emit-value map-options option-label="name" option-value="layerId" :label="$t('common.layer')" @update:model-value="onTargetChange(viz)">
                                    <template #prepend><q-icon name="layers" /></template>
                                </q-select>
                            </div>
                            <template v-if="viz.target">
                                <div class="row q-px-sm q-gutter-x-sm">
                                    <q-radio :model-value="connectionTypesMap[viz.id ?? ''] || 'single'" val="single" :label="$t('dashboard.widgetEditor.map.singleDataset')" dense size="xs" @update:model-value="setConnectionType(viz, 'single')" />
                                    <q-radio :model-value="connectionTypesMap[viz.id ?? ''] || 'single'" val="join" :label="$t('dashboard.widgetEditor.map.dataJoin')" dense size="xs" @update:model-value="setConnectionType(viz, 'join')" />
                                </div>

                                <!-- SINGLE -->
                                <template v-if="(connectionTypesMap[viz.id ?? ''] || 'single') === 'single'">
                                    <div class="row q-col-gutter-sm q-pa-sm">
                                        <div v-if="getLayerType(viz.target) === 'dataset' && viz.type === 'pies'" class="col">
                                            <q-select outlined dense multiple use-chips v-model="viz.chartMeasures" :options="getAvailableMeasures(viz.target)" option-value="alias" option-label="alias" emit-value map-options :label="$t('common.measures')" />
                                        </div>
                                        <div v-else-if="getLayerType(viz.target) === 'dataset'" class="col">
                                            <q-select outlined dense v-model="viz.targetMeasure" :options="getAvailableMeasures(viz.target)" option-value="alias" option-label="alias" emit-value map-options :label="$t('common.measure')" />
                                        </div>
                                        <div v-else class="col">
                                            <q-select outlined dense v-model="viz.targetProperty" :options="propertiesCache[viz.target] || []" option-value="property" option-label="property" emit-value map-options :label="$t('common.properties')" />
                                        </div>
                                    </div>
                                </template>

                                <!-- JOIN -->
                                <template v-if="(connectionTypesMap[viz.id ?? ''] || 'single') === 'join'">
                                    <div class="row q-col-gutter-sm q-pa-sm">
                                        <div class="col">
                                            <q-select outlined dense v-model="viz.targetDataset" :options="availableDatasets" option-value="layerId" option-label="name" emit-value map-options :label="$t('common.dataset')" @update:model-value="onDatasetChange(viz)" />
                                        </div>
                                        <div v-if="viz.targetDataset && viz.type === 'pies'" class="col">
                                            <q-select outlined dense multiple use-chips v-model="viz.chartMeasures" :options="getAvailableMeasures(viz.targetDataset)" option-value="alias" option-label="alias" emit-value map-options :label="$t('common.measures')" />
                                        </div>
                                        <div v-else-if="viz.targetDataset" class="col">
                                            <q-select outlined dense v-model="viz.targetMeasure" :options="getAvailableMeasures(viz.targetDataset)" option-value="alias" option-label="alias" emit-value map-options :label="$t('common.measure')" />
                                        </div>
                                    </div>
                                    <div v-if="viz.targetDataset" class="row q-col-gutter-sm q-px-sm q-pb-sm items-center">
                                        <div class="col">
                                            <q-select outlined dense v-model="viz.targetDatasetForeignKeyColumn" :options="getAvailableMeasures(viz.targetDataset)" option-value="alias" option-label="alias" emit-value map-options :label="$t('dashboard.widgetEditor.map.datasetJoinColumn')">
                                                <template #append><q-icon name="compare_arrows" /></template>
                                            </q-select>
                                        </div>
                                        <div v-if="getLayerType(viz.target) === 'layer'" class="col">
                                            <q-select outlined dense v-model="viz.targetProperty" :options="propertiesCache[viz.target] || []" option-value="property" option-label="property" emit-value map-options :label="$t('dashboard.widgetEditor.map.joinProperty')" />
                                        </div>
                                    </div>
                                </template>
                            </template>
                        </div>
                    </Transition>
                </div>

                <!-- Dropzone after each item -->
                <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
            </div>

            <!-- Empty state -->
            <div v-if="visualizations.length === 0" class="text-center q-pa-xl text-grey-5">
                <q-icon name="layers" size="3rem" class="q-mb-sm" />
                <div>{{ $t('dashboard.widgetEditor.map.noVisualizations') }}</div>
            </div>
        </div>
    </q-card>

    <!-- Icon picker -->
    <Teleport to="body">
        <div v-if="iconPickerVizId !== null" style="z-index: 99999; position: relative">
            <WidgetEditorStyleIconPickerDialog :prop-model="getIconPickerModel()" used-from="markers" @close="iconPickerVizId = null" @save="onIconSelected" />
        </div>
    </Teleport>

    <!-- Image picker -->
    <Teleport to="body">
        <MapVisualizationImagePickerDialog :visible="imagePickerVizId !== null" @close="imagePickerVizId = null" @set-image="onImageSelected" />
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useQuasar } from 'quasar'
import { IWidget } from '../../../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType, IMapWidgetVisualizationThreshold } from '../../../../../interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import { getMapVisualizationColors, getMapVisualizationIcon } from '../../../../MapWidget/MapWidgetVisualizationPreviewHelper'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'
import WidgetEditorStyleIconPickerDialog from '../../common/styleToolbar/WidgetEditorStyleIconPickerDialog.vue'
import MapVisualizationImagePickerDialog from './markers/MapVisualizationImagePickerDialog.vue'
import MapChartColorPicker from './MapChartColorPicker.vue'

export default defineComponent({
    name: 'map-visualization-type',
    components: { WidgetEditorColorPicker, WidgetEditorStyleIconPickerDialog, MapVisualizationImagePickerDialog, MapChartColorPicker },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: [String, Number] as PropType<string | number>, required: false }
    },
    setup() {
        const quasar = useQuasar()
        return { quasar }
    },
    data() {
        return {
            visualizations: [] as IMapWidgetVisualizationType[],
            activeIndex: -1,
            isDragging: false,
            activeDropzone: -1,
            isDraggingThreshold: false,
            thresholdDragIndex: -1,
            thresholdDragVizKey: '',
            activeThresholdDropzone: null as { vizId: string; index: number } | null,
            iconPickerVizId: null as string | null,
            imagePickerVizId: null as string | null,
            connectionTypesMap: {} as Record<string, 'single' | 'join'>,
            propertiesCache: {} as Record<string, any[]>
        }
    },
    computed: {
        visTypeOptions() {
            return [
                { value: 'choropleth', label: this.$t('dashboard.widgetEditor.map.visTypes.choropleth'), icon: 'map' },
                { value: 'markers', label: this.$t('dashboard.widgetEditor.map.visTypes.markers'), icon: 'place' },
                { value: 'heatmap', label: this.$t('dashboard.widgetEditor.map.visTypes.heatmap'), icon: 'blur_on' },
                { value: 'clusters', label: this.$t('dashboard.widgetEditor.map.visTypes.clusters'), icon: 'group_work' },
                { value: 'pies', label: this.$t('dashboard.widgetEditor.map.visTypes.charts'), icon: 'pie_chart' },
                { value: 'balloons', label: this.$t('dashboard.widgetEditor.map.visTypes.balloons'), icon: 'bubble_chart' }
            ]
        },
        availableLayersOptions() {
            return (this.widgetModel?.layers || []).map((l: IMapWidgetLayer) => ({
                layerId: l.layerId,
                name: l.name || l.label || l.layerId,
                type: l.type
            }))
        },
        availableDatasets() {
            return (this.widgetModel?.layers || []).filter((l: IMapWidgetLayer) => l.type === 'dataset')
        },
        classificationMethodOptions() {
            return [
                { label: 'dashboard.widgetEditor.map.classesMethodOptions.byEqualIntervals', value: 'CLASSIFY_BY_EQUAL_INTERVALS' },
                { label: 'dashboard.widgetEditor.map.classesMethodOptions.byQuantils', value: 'CLASSIFY_BY_QUANTILS' },
                { label: 'dashboard.widgetEditor.map.classesMethodOptions.byRanges', value: 'CLASSIFY_BY_RANGES' }
            ]
        },
        markerTypeOptions() {
            return [
                { label: 'dashboard.widgetEditor.map.markerTypes.default', value: 'default' },
                { label: 'dashboard.widgetEditor.map.markerTypes.icon', value: 'icon' },
                { label: 'dashboard.widgetEditor.map.markerTypes.image', value: 'img' },
                { label: 'dashboard.widgetEditor.map.markerTypes.web', value: 'url' }
            ]
        },
        chartTypeOptions() {
            return [
                { label: 'dashboard.widgetEditor.map.pieTypeOptions.pies', value: 'pie' },
                { label: 'dashboard.widgetEditor.map.pieTypeOptions.bars', value: 'bar' }
            ]
        }
    },
    watch: {
        widgetModel: {
            handler() {
                this.loadVisualizations()
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),

        loadVisualizations() {
            this.visualizations = this.widgetModel?.settings?.visualizations || []
            this.visualizations.forEach((viz: IMapWidgetVisualizationType) => {
                if (viz.id && !this.connectionTypesMap[viz.id]) {
                    this.connectionTypesMap[viz.id] = viz.targetDataset ? 'join' : 'single'
                }
            })
        },

        addVisualization() {
            if (!this.widgetModel.settings.visualizations) this.widgetModel.settings.visualizations = []
            const newViz = { ...mapWidgetDefaultValues.getDefaultVisualizationSettings()[0], id: crypto.randomUUID(), label: '' }
            this.widgetModel.settings.visualizations.push(newViz)
            if (newViz.id) this.connectionTypesMap[newViz.id] = 'single'
            this.loadVisualizations()
            this.activeIndex = this.visualizations.length - 1
        },

        toggleExpansion(index: number) {
            this.activeIndex = this.activeIndex === index ? -1 : index
        },

        confirmDelete(viz: IMapWidgetVisualizationType, index: number) {
            this.quasar
                .dialog({
                    title: this.$t('common.toast.deleteConfirmTitle'),
                    message: this.$t('common.toast.deleteMessage'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => {
                    if (this.widgetModel.settings.visualizations) {
                        this.widgetModel.settings.visualizations.splice(index, 1)
                    }
                    if (this.activeIndex === index) this.activeIndex = -1
                    else if (this.activeIndex > index) this.activeIndex--
                    this.loadVisualizations()
                })
        },

        onDragStart(event: DragEvent, index: number) {
            this.isDragging = true
            event.dataTransfer!.setData('text/plain', String(index))
            event.dataTransfer!.effectAllowed = 'move'
        },

        onDropAtIndex(event: DragEvent, targetIndex: number) {
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = parseInt(event.dataTransfer!.getData('text/plain'))
            if (isNaN(sourceIndex) || sourceIndex === targetIndex) return
            const items = this.widgetModel.settings.visualizations
            if (!items) return
            const moved = items.splice(sourceIndex, 1)[0]
            items.splice(sourceIndex < targetIndex ? targetIndex - 1 : targetIndex, 0, moved)
            this.activeIndex = -1
            this.loadVisualizations()
        },

        onTypeChange(_viz: IMapWidgetVisualizationType) {
            // all sub-confs are pre-initialized on add
        },

        async onTargetChange(viz: IMapWidgetVisualizationType) {
            viz.targetMeasure = undefined
            viz.targetProperty = null
            viz.chartMeasures = []
            if (viz.target) await this.loadLayerProperties(viz.target)
        },

        onDatasetChange(viz: IMapWidgetVisualizationType) {
            viz.targetMeasure = undefined
            viz.chartMeasures = []
            viz.targetDatasetForeignKeyColumn = undefined
        },

        setConnectionType(viz: IMapWidgetVisualizationType, type: 'single' | 'join') {
            if (!viz.id) return
            this.connectionTypesMap[viz.id] = type
            if (type === 'single') {
                viz.targetDataset = undefined
                viz.targetDatasetForeignKeyColumn = undefined
            } else {
                viz.targetMeasure = undefined
                viz.targetProperty = null
                viz.chartMeasures = []
            }
        },

        async loadLayerProperties(layerId: string) {
            if (!layerId || this.propertiesCache[layerId]) return
            const layer = (this.widgetModel?.layers || []).find((l: IMapWidgetLayer) => l.layerId === layerId)
            if (!layer || layer.type !== 'layer') return
            this.setLoading(true)
            try {
                const properties = await getPropertiesByLayerLabel(layer.label, this.dashboardId)
                this.propertiesCache[layerId] = properties || []
            } catch {}
            this.setLoading(false)
        },

        getAvailableMeasures(layerId: string): any[] {
            const layer = (this.widgetModel?.layers || []).find((l: IMapWidgetLayer) => l.layerId === layerId)
            return (layer as any)?.columns || []
        },

        getLayerType(layerId: string): string {
            const layer = (this.widgetModel?.layers || []).find((l: IMapWidgetLayer) => l.layerId === layerId)
            return layer?.type || 'layer'
        },

        getVisualizationIcon(type: string): string {
            return getMapVisualizationIcon(type)
        },

        getVisualizationTypeLabel(type: string): string {
            return this.$t(`dashboard.widgetEditor.map.visTypes.${type}`)
        },

        getTargetName(targetId: string): string {
            const layer = (this.widgetModel?.layers || []).find((l: IMapWidgetLayer) => l.layerId === targetId)
            return (layer as any)?.name || (layer as any)?.label || targetId
        },

        getVisualizationColors(viz: IMapWidgetVisualizationType): string[] {
            return getMapVisualizationColors(viz)
        },

        ensureThresholds(conf: any): IMapWidgetVisualizationThreshold[] {
            if (!conf.properties) conf.properties = { thresholds: [] }
            if (!conf.properties.thresholds) conf.properties.thresholds = []
            return conf.properties.thresholds
        },

        addThreshold(thresholds: IMapWidgetVisualizationThreshold[]) {
            thresholds.push({ color: 'rgba(0,0,0,1)', from: 0, to: 100 })
        },

        deleteThreshold(thresholds: IMapWidgetVisualizationThreshold[], index: number) {
            thresholds.splice(index, 1)
        },

        onThresholdDragStart(event: DragEvent, vizKey: string, index: number) {
            this.isDraggingThreshold = true
            this.thresholdDragIndex = index
            this.thresholdDragVizKey = vizKey
            event.dataTransfer!.setData('text/plain', String(index))
            event.dataTransfer!.effectAllowed = 'move'
        },

        onThresholdDrop(event: DragEvent, vizKey: string, thresholds: IMapWidgetVisualizationThreshold[], targetIndex: number) {
            this.isDraggingThreshold = false
            this.activeThresholdDropzone = null
            if (this.thresholdDragVizKey !== vizKey) return
            const sourceIndex = parseInt(event.dataTransfer!.getData('text/plain'))
            if (isNaN(sourceIndex) || sourceIndex === targetIndex) return
            const moved = thresholds.splice(sourceIndex, 1)[0]
            thresholds.splice(sourceIndex < targetIndex ? targetIndex - 1 : targetIndex, 0, moved)
        },

        isActiveThresholdDropzone(vizKey: string, index: number): boolean {
            return this.activeThresholdDropzone?.vizId === vizKey && this.activeThresholdDropzone?.index === index
        },

        getIconPickerModel(): any {
            if (!this.iconPickerVizId) return {}
            const viz = this.visualizations.find((v: IMapWidgetVisualizationType) => v.id === this.iconPickerVizId)
            return viz?.markerConf?.icon || {}
        },

        onIconSelected(icon: any) {
            const viz = this.visualizations.find((v: IMapWidgetVisualizationType) => v.id === this.iconPickerVizId)
            if (viz?.markerConf) viz.markerConf.icon = icon
            this.iconPickerVizId = null
        },

        onImageSelected(image: any) {
            const viz = this.visualizations.find((v: IMapWidgetVisualizationType) => v.id === this.imagePickerVizId)
            if (viz?.markerConf) viz.markerConf.img = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/images/getImage?IMAGES_ID=${image.imgId}`
            this.imagePickerVizId = null
        }
    }
})
</script>

<style lang="scss" scoped>
.viz-list-header {
    height: 48px;
}

.viz-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    background: #fff;

    .viz-row-header {
        min-height: 38px;
    }

    .kn-drag-handle {
        background-color: #f0f0f0;
        color: var(--kn-color-primary);
    }

    .kn-action-handle {
        background-color: #f0f0f0;
    }
}

.viz-form {
    border-top: 1px solid #ececec;
}

.viz-meta-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--kn-color-primary);
    letter-spacing: 0.03em;
    flex-shrink: 0;
    margin-left: 2px;
}

.section-label {
    display: flex;
    align-items: center;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #555;
    letter-spacing: 0.06em;
    padding: 5px 12px 4px;
    background: #f5f5f5;
    border-bottom: 1px solid #ececec;
    border-top: 1px solid #ececec;
}

.color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.12);
    flex-shrink: 0;
}

.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

// Expand / collapse animation
.viz-expand-enter-active,
.viz-expand-leave-active {
    overflow: hidden;
    transition:
        max-height 0.2s ease,
        opacity 0.15s ease;
}
.viz-expand-enter-from,
.viz-expand-leave-to {
    max-height: 0;
    opacity: 0;
}
.viz-expand-enter-to,
.viz-expand-leave-from {
    max-height: 900px;
    opacity: 1;
}
</style>
