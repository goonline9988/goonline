import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const uploadToImageKit = async (file, folder) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const response = await imagekit.upload({
        file: buffer,
        fileName: file.name,
        folder,
    });
    return imagekit.url({
        path: response.filePath,
        transformation: [
            { quality: 'auto' },
            { format: 'webp' },
            { width: '1280' },
        ],
    });
}

export async function PATCH(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type') || '';
        const data = {};
        let logoUrl, bannerUrl;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const fields = ['name', 'description', 'email', 'contact', 'whatsapp', 'brandColor', 'address', 'username'];
            for (const f of fields) {
                if (formData.get(f) !== null && formData.get(f) !== undefined) {
                    data[f] = formData.get(f);
                }
            }
            const logo = formData.get('logo');
            const banner = formData.get('banner');
            if (logo && typeof logo === 'object') logoUrl = await uploadToImageKit(logo, 'logos');
            if (banner && typeof banner === 'object') bannerUrl = await uploadToImageKit(banner, 'banners');
        } else {
            const body = await request.json();
            Object.assign(data, body);
        }

        if (logoUrl) data.logo = logoUrl;
        if (bannerUrl) data.banner = bannerUrl;

        if (data.username) data.username = String(data.username).toLowerCase().trim();

        await prisma.store.update({
            where: { id: storeId },
            data,
        });

        return NextResponse.json({ message: 'Store settings updated' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
