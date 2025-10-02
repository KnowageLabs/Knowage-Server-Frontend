<template>
    <div v-if="(selectionIsLocked || playSelectionButtonVisible) && inFocus && !hideSelectionLock" class="lockButtonContainer" @mouseover="$emit('changeFocus', true)" @mouseleave="$emit('changeFocus', false)">
        <i v-if="selectionIsLocked" class="fas fa-lock kn-cursor-pointer click-icon" @click="$emit('unlockSelection')" />
        <i v-if="playSelectionButtonVisible" class="fas fa-play kn-cursor-pointer click-icon" @click="$emit('launchSelection')" />
    </div>

    <div v-if="helpConfig.enabled" class="infoButtonContainer" :class="[helpConfig.iconPosition]" @mouseover="$emit('changeFocus', true)" @mouseleave="$emit('changeFocus', false)">
        <i :class="helpConfig.icon" data-test="hint" @click="handleHelpClick()" />
        <q-tooltip v-if="helpConfig.visualizationType === 'tooltip' && helpConfig.type === 'free-text'">{{ helpConfig.text }}</q-tooltip>
        <q-tooltip v-else-if="helpConfig.visualizationType === 'tooltip' && helpConfig.type === 'link'">{{ helpConfig.url }}</q-tooltip>
    </div>

    <div v-if="widgetButtonBarVisible" class="widgetButtonBarContainer">
        <i class="fa-solid fa-grip-vertical drag-handle drag-widget-icon"></i>
        <Button type="button" icon="fa-solid fa-ellipsis-h" class="p-button-outlined p-button-rounded widgetMenuButton" @click="qMenuShown = true" />
    </div>

    <div class="qmenu-anchor">
        <q-menu v-model:model-value="qMenuShown" anchor="top right" self="top left" no-parent-event data-test="menu">
            <q-list style="min-width: 100px">
                <q-item v-for="(item, index) in menuItems" :key="index" v-ripple dense clickable :style="{ display: item.visible ? 'flex' : 'none' }" data-test="close-button" @click="closeMenu(item.command)">
                    <q-item-section>
                        <div>
                            <i class="p-mr-3" :class="item.icon" />
                            <label>{{ item.label }}</label>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-menu>
    </div>

    <q-dialog v-model="helpDialogVisible">
        <q-card style="overflow: hidden" :style="{ width: `${helpConfig.popupWidth}px`, height: `${helpConfig.popupHeight}px`, 'max-width': 'none' }">
            <q-card-section class="q-pt-none kn-height-full p-m-0 p-px-0 p-py-0">
                <p v-if="helpConfig.type === 'free-text'" style="word-wrap: break-word" v-html="helpConfig.text" class="q-ma-sm"></p>
                <iframe v-else-if="helpConfig.type === 'link'" class="kn-width-full kn-height-full" ref="iframe" :src="helpConfig.url"></iframe>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget buttons and visibility.
 */
import { defineComponent, PropType } from 'vue'
import { IDashboard, IMenuItem, IWidget, IWidgetHelpSettings } from '../Dashboard'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { canEditDashboard } from '../DashboardHelpers'

export default defineComponent({
    name: 'widget-button-bar',
    components: {},
    props: {
        document: { type: Object, required: true },
        widget: { type: Object as PropType<IWidget>, required: true },
        playSelectionButtonVisible: { type: Boolean, required: true },
        selectionIsLocked: { type: Boolean, required: true },
        dashboardId: { type: String, required: true },
        inFocus: { type: Boolean, required: true },
        menuItems: { type: Object as PropType<IMenuItem[]> }
    },
    emits: ['editWidget', 'unlockSelection', 'launchSelection', 'changeFocus'],
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            qMenuShown: false,
            dashboardModel: null as IDashboard | null,
            helpDialogVisible: false,
            isCtrlKeyPressed: false
        }
    },
    mounted() {
        window.addEventListener('keydown', this.handleCtrlKey)
        window.addEventListener('keyup', this.handleCtrlKey)
    },

    beforeUnmount() {
        window.removeEventListener('keydown', this.handleCtrlKey)
        window.removeEventListener('keyup', this.handleCtrlKey)
    },
    computed: {
        widgetButtonBarVisible() {
            const dashboardModel = this.getDashboard(this.dashboardId)
            const widgetMenuEnabled = dashboardModel?.configuration?.menuWidgets?.enableWidgetMenu && this.widget?.settings?.configuration?.widgetMenu?.enabled
            if (this.isCtrlKeyPressed || widgetMenuEnabled) return true
            // if (canEditDashboard(this.document)) return true - commented to always hide the menu unless ctrl is pressed or menu is enabled
            return widgetMenuEnabled
        },
        helpConfig(): IWidgetHelpSettings {
            return this.widget?.settings?.help
        },
        hideSelectionLock(): boolean {
            return this.document.seeAsFinalUser && this.isSelectionLocked
        },
        isSelectionLocked(): boolean {
            if (this.widget.type !== 'selector') return false

            const selections = this.store.getSelections(this.dashboardId)
            const currentWidget = this.widget
            if (!selections || !selections.length || !currentWidget) return false

            const widgetDatasetId = currentWidget.dataset
            const widgetColumnName = currentWidget.columns && currentWidget.columns.length > 0 ? currentWidget.columns[0].columnName : null
            if (!widgetDatasetId || !widgetColumnName) return false

            const matchingSelection = selections.find((selection) => selection.datasetId === widgetDatasetId && selection.columnName === widgetColumnName && selection.value && selection.value.length > 0)
            if (matchingSelection) return matchingSelection.locked
            else return false
        }
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboard', 'getSelections']),
        toggle(event) {
            const menu = this.$refs.widgetmenu as any
            menu.toggle(event)
        },
        editWidget() {
            this.$emit('editWidget')
        },
        closeMenu(command) {
            this.qMenuShown = false
            command()
        },
        handleHelpClick() {
            if (this.helpConfig.visualizationType === 'tooltip' && this.helpConfig.type === 'link') window.open(this.helpConfig.url, '_blank')
            else if (this.helpConfig.visualizationType === 'pop-up') this.helpDialogVisible = true
        },
        handleCtrlKey(event) {
            this.isCtrlKeyPressed = event.ctrlKey
        }
    }
})
</script>
<style lang="scss">
.lockButtonContainer {
    width: 32px;
    height: 32px;
    position: absolute;
    right: -32px;
    background-color: #a9c3db;
    color: rgb(82, 82, 82);
    border: 1px solid #ccc;
    display: flex;
    z-index: 99999999 !important;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
}

.infoButtonContainer {
    cursor: pointer;
    width: 32px;
    height: 32px;
    font-size: 20px;
    align-content: center;
    text-align: center;
    position: absolute;
    z-index: 99999999 !important;
    &.top-right {
        right: 0px;
        top: 0px;
    }
    &.top-left {
        left: 0px;
        top: 0px;
    }
    &.bottom-right {
        right: 3px;
        bottom: 3px;
    }
    &.bottom-left {
        left: 0px;
        bottom: 25px;
    }
}

.widgetButtonBarContainer {
    display: none;
    z-index: 1001;
    position: absolute;
    bottom: 2px;
    left: 2px;
    .widgetMenuButton.p-button.p-button-outlined:enabled {
        background-color: rgba(256, 256, 256, 0.6);
        &:hover {
            outline: 2px solid #0085f290;
            background-color: rgba(246, 246, 246, 0.8);
        }
        &:active {
            background-color: rgba(216, 216, 216, 0.8);
        }
    }
}

.qmenu-anchor {
    position: absolute;
    bottom: 15px;
    left: 20px;
}

.drag-widget-icon {
    display: none;
    height: 26px;
    width: 26px;
    text-align: center;
    padding: 6px;
    font-size: 1.1rem;
    cursor: grab;
    color: rgba(0, 0, 0, 0.4);
    &:active {
        cursor: grabbing;
    }
}
.speed-dial-menu {
    position: relative;
    .p-speeddial-button {
        width: 3.5rem !important;
        height: 3.5rem !important;
        span {
            font-size: 1.5rem !important;
        }
    }
}
.click-icon {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
</style>
