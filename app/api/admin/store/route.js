import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { storeId } = await request.json()
        if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 })

        const store = await prisma.store.findUnique({ where: { id: String(storeId) } })
        if (!store) return NextResponse.json({ error: 'store not found' }, { status: 404 })

        await prisma.$transaction(async (tx) => {
            // unlink buyer orders from this store (do not delete the buyer history)
            await tx.order.updateMany({
                where: { storeId: store.id },
                data: { storeId: null },
            }).catch(() => null)
            // unlink ratings whose products are removed (cascade covers product; orphan ratings handled)
            await tx.rating.deleteMany({
                where: { product: { storeId: store.id } },
            })
            // products are cascade-deleted by the FK onDelete: Cascade
            await tx.store.delete({ where: { id: store.id } })
        })

        return NextResponse.json({ message: 'Store deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
