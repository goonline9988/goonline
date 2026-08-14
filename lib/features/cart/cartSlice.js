import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'gocart:cartByStore:v1'

const isBrowser = typeof window !== 'undefined'

const loadInitial = () => {
    if (!isBrowser) return { cartByStore: {} }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) return { cartByStore: JSON.parse(raw) }
    } catch (e) {
        // ignore
    }
    return { cartByStore: {} }
}

const persist = (state) => {
    if (!isBrowser) return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cartByStore))
    } catch (e) {
        // ignore quota errors
    }
}

const sameLine = (a, b) => a.productId === b.productId && (a.size || '') === (b.size || '') && (a.color || '') === (b.color || '')

const cartSlice = createSlice({
    name: 'cart',
    initialState: loadInitial(),
    reducers: {
        addToCart: (state, action) => {
            const { storeId, product, size = null, color = null, qty = 1 } = action.payload
            if (!storeId || !product) return
            if (!state.cartByStore[storeId]) {
                state.cartByStore[storeId] = { items: [] }
            }
            const items = state.cartByStore[storeId].items
            const existing = items.find(it => sameLine(it, { productId: product.id, size, color }))
            if (existing) {
                existing.qty += qty
            } else {
                items.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image || null,
                    size,
                    color,
                    qty,
                })
            }
            persist(state)
        },
        updateQty: (state, action) => {
            const { storeId, index, qty } = action.payload
            const items = state.cartByStore?.[storeId]?.items
            if (!items || !items[index]) return
            if (qty <= 0) {
                items.splice(index, 1)
            } else {
                items[index].qty = qty
            }
            if (items.length === 0) {
                delete state.cartByStore[storeId]
            }
            persist(state)
        },
        removeLine: (state, action) => {
            const { storeId, index } = action.payload
            const items = state.cartByStore?.[storeId]?.items
            if (!items) return
            items.splice(index, 1)
            if (items.length === 0) {
                delete state.cartByStore[storeId]
            }
            persist(state)
        },
        clearStoreCart: (state, action) => {
            const { storeId } = action.payload
            if (state.cartByStore?.[storeId]) {
                delete state.cartByStore[storeId]
            }
            persist(state)
        },
        clearAll: (state) => {
            state.cartByStore = {}
            persist(state)
        },
        hydrate: (state, action) => {
            state.cartByStore = action.payload || {}
        },
    },
})

export const { addToCart, updateQty, removeLine, clearStoreCart, clearAll, hydrate } = cartSlice.actions
export default cartSlice.reducer
