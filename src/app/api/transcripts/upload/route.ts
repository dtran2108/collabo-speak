import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

const TRANSCRIPT_BUCKET = 'transcript-simple'

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { fileName, content } = await request.json()

    if (!fileName || !content) {
      return NextResponse.json(
        { error: 'File name and content are required' },
        { status: 400 }
      )
    }

    // Create a Blob from the content
    const blob = new Blob([content], { type: 'text/plain' })
    
    // Create file path with user ID folder to match RLS policy
    const filePath = `${user.email}/${fileName}`
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(TRANSCRIPT_BUCKET)
      .upload(filePath, blob, {
        contentType: 'text/plain',
        upsert: true // Overwrite if file exists
      })

    if (uploadError) {
      console.error('Error uploading transcript:', uploadError)
      console.error('Upload details:', {
        bucket: TRANSCRIPT_BUCKET,
        fileName,
        filePath,
        fileSize: blob.size,
        user: user.id
      })
      return NextResponse.json(
        { 
          error: 'Failed to upload transcript',
          details: uploadError.message,
          bucket: TRANSCRIPT_BUCKET
        },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(TRANSCRIPT_BUCKET)
      .getPublicUrl(uploadData.path)

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: uploadData.path 
    })
  } catch (error) {
    console.error('Upload transcript API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
