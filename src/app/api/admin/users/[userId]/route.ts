import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/admin-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin role
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // First, get user email for logging purposes
    const { data: userToDelete, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !userToDelete?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = userToDelete.user.email

    // Delete related data first (due to foreign key constraints)
    // Delete from participation_log
    const { error: participationError } = await supabaseAdmin
      .from('participation_log')
      .delete()
      .eq('userId', userId)

    if (participationError) {
      console.error('Error deleting participation logs:', participationError)
      return NextResponse.json(
        { error: 'Failed to delete user participation data' },
        { status: 500 }
      )
    }

    // Delete from roleToUser
    const { error: roleError } = await supabaseAdmin
      .from('roleToUser')
      .delete()
      .eq('userId', userId)

    if (roleError) {
      console.error('Error deleting user roles:', roleError)
      return NextResponse.json(
        { error: 'Failed to delete user roles' },
        { status: 500 }
      )
    }

    // Delete from user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete user profile' },
        { status: 500 }
      )
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user from authentication system' },
        { status: 500 }
      )
    }

    console.log(`User ${userEmail} (${userId}) deleted successfully by admin ${user.email}`)

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userId,
        email: userEmail
      }
    })

  } catch (error) {
    console.error('Delete user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
