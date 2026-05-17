import { NextRequest, NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'
import { v2 as cloudinary } from 'cloudinary'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { ApiResponse } from '@/types'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    // Step 1: Verify auth
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken)
    const privyId = verifiedClaims.userId

    // Step 2: Get image from form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'avatar'

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Step 3: Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File must be under 5MB' },
        { status: 400 }
      )
    }

    // Step 4: Convert to base64 and upload to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder:         'beefree/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })

    const imageUrl = uploadResult.secure_url

    // Step 5: Save URL to MongoDB
    await connectDB()
    await User.findOneAndUpdate(
      { privyId },
      { avatar: imageUrl },
      { new: true }
    )

    console.log('[Upload] Avatar uploaded for', privyId, '→', imageUrl)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { url: imageUrl },
    })
  } catch (error) {
    console.error('[Upload Error]', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
