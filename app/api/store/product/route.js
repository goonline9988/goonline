import imagekit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const parseList = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean)
    if (typeof val === "string") {
        return val.split(",").map((s) => s.trim()).filter(Boolean)
    }
    return []
}

// Add a new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const sizes = parseList(formData.get("sizes"))
        const colors = parseList(formData.get("colors"))
        const images = formData.getAll("images")

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: 'missing product details' }, { status: 400 })
        }

        const imagesUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products",
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1024' }
                ]
            })
            return url
        }))

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                sizes,
                colors,
                images: imagesUrl,
                storeId
            }
        })

        return NextResponse.json({ message: "Product added successfully" })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all products for a seller
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }
        const products = await prisma.product.findMany({ where: { storeId } })

        return NextResponse.json({ products })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Update product
export async function PATCH(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) return NextResponse.json({ error: 'not authorized' }, { status: 401 })

        const contentType = request.headers.get('content-type') || ''
        const data = {}
        let newImageUrls = []

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const id = formData.get('id')
            if (!id) return NextResponse.json({ error: 'missing product id' }, { status: 400 })

            for (const f of ['name', 'description', 'category']) {
                if (formData.get(f) !== null && formData.get(f) !== undefined) data[f] = formData.get(f)
            }
            for (const f of ['mrp', 'price']) {
                if (formData.get(f) !== null && formData.get(f) !== undefined) data[f] = Number(formData.get(f))
            }
            for (const f of ['sizes', 'colors']) {
                if (formData.get(f) !== null && formData.get(f) !== undefined) data[f] = parseList(formData.get(f))
            }
            if (formData.get('inStock') !== null) data.inStock = formData.get('inStock') === 'true'

            const replaceImages = formData.get('replaceImages') === 'true'
            const images = formData.getAll('images')
            if (images.length > 0) {
                newImageUrls = await Promise.all(images.map(async (image) => {
                    const buffer = Buffer.from(await image.arrayBuffer());
                    const response = await imagekit.upload({
                        file: buffer,
                        fileName: image.name,
                        folder: "products",
                    })
                    return imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1024' }
                        ]
                    })
                }))
                if (replaceImages) {
                    data.images = newImageUrls
                } else {
                    const existing = await prisma.product.findUnique({ where: { id: String(id) } })
                    data.images = [...(existing?.images || []), ...newImageUrls]
                }
            }

            const existing = await prisma.product.findFirst({ where: { id: String(id), storeId } })
            if (!existing) return NextResponse.json({ error: 'product not found' }, { status: 404 })

            await prisma.product.update({ where: { id: String(id) }, data })
            return NextResponse.json({ message: 'Product updated' })
        } else {
            const body = await request.json()
            const { id, ...rest } = body
            if (!id) return NextResponse.json({ error: 'missing product id' }, { status: 400 })
            if (rest.sizes) rest.sizes = parseList(rest.sizes)
            if (rest.colors) rest.colors = parseList(rest.colors)
            const existing = await prisma.product.findFirst({ where: { id: String(id), storeId } })
            if (!existing) return NextResponse.json({ error: 'product not found' }, { status: 404 })
            await prisma.product.update({ where: { id: String(id) }, data: rest })
            return NextResponse.json({ message: 'Product updated' })
        }
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Delete product
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) return NextResponse.json({ error: 'not authorized' }, { status: 401 })

        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: 'missing product id' }, { status: 400 })

        const existing = await prisma.product.findFirst({ where: { id: String(id), storeId } })
        if (!existing) return NextResponse.json({ error: 'product not found' }, { status: 404 })

        await prisma.product.delete({ where: { id: String(id) } })
        return NextResponse.json({ message: 'Product deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
