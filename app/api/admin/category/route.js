import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function GET() {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } })
        return NextResponse.json({ categories })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { name, image } = await request.json()
        if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
        const slug = slugify(name)
        const category = await prisma.category.create({ data: { name, slug, image: image || null } })
        return NextResponse.json({ category, message: 'Category created' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

export async function PATCH(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { id, name, image } = await request.json()
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        const data = {}
        if (name) { data.name = name; data.slug = slugify(name) }
        if (image !== undefined) data.image = image
        const category = await prisma.category.update({ where: { id: String(id) }, data })
        return NextResponse.json({ category, message: 'Category updated' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        if (!await authAdmin(userId)) return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        const { searchParams } = request.nextUrl
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
        await prisma.category.delete({ where: { id: String(id) } })
        return NextResponse.json({ message: 'Category deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
