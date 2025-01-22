export const findObjectById = (tree, id) => {
    if (!tree.id) {
        for (const key in tree) {
            if (tree[key].id == id) return tree[key]
            if (tree[key].children && tree[key].children.length > 0) {
                for (let i = 0; i < tree[key].children.length; i++) {
                    const result = findObjectById(tree[key].children[i], id)
                    if (result) return result
                }
            }
        }
    }

    if (tree.id == id) return tree
    if (tree.children && tree.children.length > 0) {
        for (let i = 0; i < tree.children.length; i++) {
            const result = findObjectById(tree.children[i], id)
            if (result) return result
        }
    }

    return null
}

export const findObjectByKey = (tree, key) => {
    if (!tree.key) {
        for (const nodeKey in tree) {
            if (tree[nodeKey].key == key) return tree[nodeKey]
            if (tree[nodeKey].children && tree[nodeKey].children.length > 0) {
                for (let i = 0; i < tree[nodeKey].children.length; i++) {
                    const result = findObjectByKey(tree[nodeKey].children[i], key)
                    if (result) return result
                }
            }
        }
    }
    if (tree.key == key) return tree
    if (tree.children && tree.children.length > 0) {
        for (let i = 0; i < tree.children.length; i++) {
            const result = findObjectByKey(tree.children[i], key)
            if (result) return result
        }
    }
    return null
}
