import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/admin-utils'

// Helper functions
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

    const { id: sessionId } = await params

    // Parse request body
    const body = await request.json()
    const { name, description, agentId, isReady } = body

    // Validate required fields
    if (!name || !description || !agentId) {
      return NextResponse.json(
        { error: 'Name, description, and agentId are required' },
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

    // Validate agentId length
    if (agentId.length < 1) {
      return NextResponse.json(
        { error: 'AgentId must not be empty' },
        { status: 400 },
      )
    }

    // Check if session exists
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      )
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        name,
        description,
        agentId,
        isReady: Boolean(isReady),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError || !updatedSession) {
      console.error('Error updating session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 },
      )
    }

    console.log(`Session ${sessionId} updated successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Session updated successfully',
      session: {
        id: updatedSession.id,
        name: updatedSession.name,
        description: updatedSession.description,
        agentId: updatedSession.agentId,
        isReady: updatedSession.isReady,
        createdAt: updatedSession.created_at,
      },
    })
  } catch (error) {
    console.error('Update session API error:', error)
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

    const { id: sessionId } = await params

    // Check if session exists and get its name for logging
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('id, name')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      )
    }

    // Check if session has any participation logs
    const { data: participationLogs, error: participationError } = await supabaseAdmin
      .from('participation_log')
      .select('id')
      .eq('sessionId', sessionId)
      .limit(1)

    if (participationError) {
      console.error('Error checking participation logs:', participationError)
      return NextResponse.json(
        { error: 'Failed to check session dependencies' },
        { status: 500 },
      )
    }

    if (participationLogs && participationLogs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete session with existing participation logs. Please delete participation logs first.' },
        { status: 400 },
      )
    }

    // Check if session has any personas
    const { data: personas, error: personasError } = await supabaseAdmin
      .from('personas')
      .select('id')
      .eq('sessionId', sessionId)
      .limit(1)

    if (personasError) {
      console.error('Error checking personas:', personasError)
      return NextResponse.json(
        { error: 'Failed to check session dependencies' },
        { status: 500 },
      )
    }

    if (personas && personas.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete session with existing personas. Please delete personas first.' },
        { status: 400 },
      )
    }

    // Delete session
    const { error: deleteError } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      console.error('Error deleting session:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 },
      )
    }

    console.log(`Session ${existingSession.name} (${sessionId}) deleted successfully by admin ${authResult.user.email}`)

    return NextResponse.json({
      message: 'Session deleted successfully',
      sessionId,
    })
  } catch (error) {
    console.error('Delete session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
