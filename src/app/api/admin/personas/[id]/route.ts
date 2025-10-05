import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/admin-utils'

async function validateAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Authorization header required', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return { error: 'Invalid token', status: 401 }
  }

  const adminCheck = await isAdmin(user.id)
  if (!adminCheck) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    const { id: personaId } = await params

    // Parse request body
    const body = await request.json()
    const { name, description, sessionId, avatarUrl } = body

    // Validate required fields
    if (!name || !description || !sessionId) {
      return NextResponse.json(
        { error: 'Name, description, and sessionId are required' },
        { status: 400 },
      )
    }

    // Validate name length
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 },
      )
    }

    // Validate description length
    if (description.length < 5) {
      return NextResponse.json(
        { error: 'Description must be at least 5 characters long' },
        { status: 400 },
      )
    }

    // Validate sessionId exists
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 400 },
      )
    }

    // Validate avatarUrl if provided
    if (avatarUrl && avatarUrl.trim() !== '') {
      try {
        new URL(avatarUrl)
      } catch {
        return NextResponse.json(
          { error: 'Avatar URL must be a valid URL' },
          { status: 400 },
        )
      }
    }

    // Check if persona exists
    const { data: existingPersona, error: fetchError } = await supabaseAdmin
      .from('personas')
      .select('id')
      .eq('id', personaId)
      .single()

    if (fetchError || !existingPersona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 },
      )
    }

    // Update persona
    const { data: updatedPersona, error: updateError } = await supabaseAdmin
      .from('personas')
      .update({
        name,
        description,
        sessionId,
        avatarUrl: avatarUrl || null,
      })
      .eq('id', personaId)
      .select()
      .single()

    if (updateError || !updatedPersona) {
      console.error('Error updating persona:', updateError)
      return NextResponse.json(
        { error: 'Failed to update persona' },
        { status: 500 },
      )
    }

    console.log(`Persona ${name} updated successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Persona updated successfully',
      persona: {
        id: updatedPersona.id,
        name: updatedPersona.name,
        description: updatedPersona.description,
        sessionId: updatedPersona.sessionId,
        avatarUrl: updatedPersona.avatarUrl,
        createdAt: updatedPersona.created_at,
      },
    })
  } catch (error) {
    console.error('Update persona API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      )
    }

    const { id: personaId } = await params

    // Check if persona exists
    const { data: existingPersona, error: fetchError } = await supabaseAdmin
      .from('personas')
      .select('id, name')
      .eq('id', personaId)
      .single()

    if (fetchError || !existingPersona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 },
      )
    }

    // Delete persona
    const { error: deleteError } = await supabaseAdmin
      .from('personas')
      .delete()
      .eq('id', personaId)

    if (deleteError) {
      console.error('Error deleting persona:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete persona' },
        { status: 500 },
      )
    }

    console.log(`Persona ${existingPersona.name} deleted successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Persona deleted successfully',
    })
  } catch (error) {
    console.error('Delete persona API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
