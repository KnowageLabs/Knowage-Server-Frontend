<template>
    <div v-for="entity in entities" :key="entity.id" class="expandable-entities">
        <h4
            v-tooltip.top="getTooltipText(entity)"
            class="entity-item-container"
            :class="{ 'group-item-container': isGroupNode(entity) }"
            :style="{ 'border-left': `10px solid ${entity.color}`, 'padding-left': `${8 + depth * 10}px` }"
            :draggable="!isGroupNode(entity)"
            :data-test="'entity-container-' + entity.id"
            @dragstart="onDragStart($event, entity)"
        >
            <i v-tooltip.top="getNodeTypeLabel(entity)" :class="getIconCls(entity.attributes.iconCls)" class="p-mx-2" />
            <span class="kn-flex" :data-test="'expand-' + entity.id" @click="expandEntity(entity)">{{ entity.text }}</span>
            <Button v-if="!isGroupNode(entity)" v-tooltip.top="$t('qbe.entities.relations')" icon="fas fa-info" class="p-button-text p-button-rounded p-button-plain" @click="$emit('showRelationDialog', entity)" />
            <Button v-if="entity.expanded" icon="pi pi-chevron-up" class="p-button-text p-button-rounded p-button-plain" @click="entity.expanded = false" />
            <Button v-else icon="pi pi-chevron-down" class="p-button-text p-button-rounded p-button-plain" @click="entity.expanded = true" />
        </h4>
        <div v-if="isGroupNode(entity) && entity.expanded" class="entity-children">
            <QBEExpandableEntity
                :available-entities="entity.children"
                :query="query"
                :depth="depth + 1"
                @showRelationDialog="$emit('showRelationDialog', $event)"
                @entityClicked="$emit('entityClicked', $event)"
                @entityChildClicked="$emit('entityChildClicked', $event)"
                @openFilterDialog="$emit('openFilterDialog', $event)"
            />
        </div>
        <ul v-else-if="entity.expanded" class="entity-children">
            <li v-for="(child, index) in entity.children" :key="index" v-tooltip.top="getTooltipText(child)" :style="{ 'border-left': `10px solid ${child.color}`, 'padding-left': `${20 + (depth + 1) * 10}px` }" draggable="true" @click="$emit('entityChildClicked', child)" @dragstart="onDragStart($event, child)">
                <i v-tooltip.top="$t(`qbe.entities.types.${child.attributes.iconCls}`)" :class="getIconCls(child.attributes.iconCls)" class="p-mx-2" />
                <span :data-test="'entity-' + entity.id">{{ child.text }}</span>
                <Button icon="fas fa-filter" :class="{ 'qbe-active-filter-icon': fieldHasFilters(child) }" class="p-button-text p-button-rounded p-button-plain p-ml-auto" :data-test="'child-' + child.id" @click.stop="openFiltersDialog(child)" />
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iQuery, iQbeTreeNode } from '../QBE'
import { isQbeGroup } from '@/helpers/commons/qbeHelpers'

export default defineComponent({
    name: 'qbe-expandable-entity',
    components: {},
    props: { availableEntities: { type: Array as PropType<iQbeTreeNode[]>, default: () => [] }, query: { type: Object as PropType<iQuery>, required: true }, depth: { type: Number, default: 0 } },
    emits: ['close', 'showRelationDialog', 'openFilterDialog', 'entityChildClicked', 'entityClicked'],
    data() {
        return {
            entities: [] as iQbeTreeNode[],
            colors: ['#D7263D', '#F46036', '#2E294E', '#1B998B', '#C5D86D', '#3F51B5', '#8BC34A', '#009688', '#F44336']
        }
    },
    watch: {
        availableEntities() {
            this.entities = this.availableEntities
            this.setupEntities()
        }
    },
    created() {
        this.entities = this.availableEntities
        this.setupEntities()
    },
    methods: {
        expandEntity(entity: iQbeTreeNode) {
            entity.expanded = !entity.expanded
        },
        setupEntities(entitiesToSetup = this.entities, usedColorIndex = 0) {
            entitiesToSetup?.forEach((entity) => {
                if (this.isGroupNode(entity)) {
                    entity.color = '#78909c'
                    usedColorIndex = this.setupEntities(entity.children ?? [], usedColorIndex)
                } else {
                    if (!this.colors[usedColorIndex]) usedColorIndex = 0
                    const color = entity.color ?? this.colors[usedColorIndex]
                    usedColorIndex++
                    entity.color = color
                    if (entity.children) {
                        entity.children.forEach((child) => {
                            child.color = color
                        })
                    }
                }
            })
            return usedColorIndex
        },
        isGroupNode: isQbeGroup,
        getNodeTypeLabel(entity: iQbeTreeNode) {
            return this.isGroupNode(entity) ? entity.text : this.$t(`qbe.entities.types.${entity.attributes.iconCls}`)
        },
        getIconCls(iconCls) {
            switch (iconCls) {
                case 'folder':
                    return 'fas fa-folder'
                case 'measure':
                    return 'fas fa-ruler'
                case 'cube':
                    return 'fas fa-cube'
                case 'calculation':
                    return 'fas fa-calculator'
                case 'dimension':
                    return 'fas fa-ruler-horizontal'
                case 'geographic dimension':
                    return 'fas fa-map-marked-alt'
                case 'attribute':
                    return 'fas fa-font'
                case 'generic':
                    return 'fas fa-layer-group'
                case 'geographic_dimension':
                    return 'fas fa-globe'
                default:
                    return 'fas fa-cube'
            }
        },
        getTooltipText(item: iQbeTreeNode) {
            return item.qtip || item.attributes.longDescription || item.attributes.londDescription || item.description || item.text || ''
        },
        onDragStart(event, entity) {
            if (this.isGroupNode(entity)) {
                event.preventDefault()
                return
            }
            event.dataTransfer.setData('text', JSON.stringify(entity))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        openFiltersDialog(field: any) {
            this.$emit('openFilterDialog', field)
        },
        fieldHasFilters(field: any) {
            for (let i = 0; i < this.query.filters?.length; i++) {
                const tempFilter = this.query.filters[i]
                if (tempFilter.leftOperandValue === field.id) {
                    return true
                }
            }
            return false
        }
    }
})
</script>
<style lang="scss">
.expandable-entities {
    ul {
        background-color: #eceff1;
        margin: 0;
        list-style: none;
        padding-left: 0;
        cursor: pointer;
        li {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 4px 0px 4px 20px;
            font-size: 0.8rem;
            border-bottom: 1px solid #cccccc;
            height: 24px;
            cursor: grab;
            button {
                margin: 0;
                padding: 0;
                width: 32px;
            }
            &:hover {
                background-color: color.adjust(#eceff1, $lightness: -10%);
            }
            i {
                cursor: help;
            }
            span {
                padding-left: 5px;
                flex: 1;
            }
        }
    }
    > .entity-children {
        padding-left: 0;
    }
    h4 {
        display: flex;
        background-color: #fff;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        height: 24px;
        line-height: 24px;
        margin: 0;
        padding: 4px 8px 4px 8px;
        font-size: 0.8rem;
        border-bottom: 1px solid #ccc;
        outline: none;
        cursor: grab;
        &:hover {
            background-color: color.adjust(#ffffff, $lightness: -15%);
        }
        button {
            cursor: pointer;
        }
        i {
            cursor: help;
        }
        &.group-item-container {
            cursor: pointer;
        }
    }
}

.qbe-active-filter-icon {
    color: red !important;
}
</style>
