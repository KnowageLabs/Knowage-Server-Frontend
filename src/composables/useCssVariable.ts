import { onBeforeUnmount, onMounted, ref, Ref } from 'vue'

// Reads a CSS variable as it applies to an element, and follows changes made to the style of the element or of any ancestor, like a theme being applied or edited.
export function useCssVariable(element: Ref<HTMLElement | null>, name: string) {
    const value = ref('')
    let observer: MutationObserver | null = null

    const read = () => {
        if (element.value) value.value = getComputedStyle(element.value).getPropertyValue(name).trim()
    }

    onMounted(() => {
        read()
        observer = new MutationObserver(read)
        for (let node: HTMLElement | null = element.value; node; node = node.parentElement) observer.observe(node, { attributes: true, attributeFilter: ['style', 'class'] })
    })

    onBeforeUnmount(() => observer?.disconnect())

    return value
}
