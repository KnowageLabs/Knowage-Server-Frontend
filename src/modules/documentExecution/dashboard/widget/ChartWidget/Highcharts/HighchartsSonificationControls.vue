<template>
    <div class="p-d-flex p-flex-row p-jc-center p-mb-1">
        <Button icon="fa fa-play" tab-index="1" aria-label="play" class="p-button-lg p-button-text p-button-rounded p-button-plain sonification-button p-mx-1" @click="$emit('playSonify')" />
        <Button icon="fa fa-pause" tab-index="2" aria-label="pause" class="p-button-lg p-button-text p-button-rounded p-button-plain sonification-button p-mx-1" @click="$emit('pauseSonify')" />
        <Button icon="fa fa-stop" tab-index="3" aria-label="stop" class="p-button-lg p-button-text p-button-rounded p-button-plain sonification-button p-mx-1" @click="$emit('cancelSonify')" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'highcharts-sonification-controls',
    components: {},
    emits: ['playSonify', 'pauseSonify', 'cancelSonify'],
    data() {
        return {}
    },
    created() {},
    methods: {}
})
</script>

<style lang="scss" scoped>
.sonification-button {
    color: rgba(0, 0, 0, 0.54);
    cursor: pointer;
}
</style>
