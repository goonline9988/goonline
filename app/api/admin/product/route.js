import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function PATCH(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { id, inStock } = await request.json()
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        const product = await prisma.product.update({ where: { id: String(id) }, data: { inStock: !!inStock } })
        return NextResponse.json({ product, message: inStock ? 'Product visible' : 'Product hidden' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        await prisma.product.delete({ where: { id: String(id) } })
        return NextResponse.json({ message: 'Product deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
