import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck } from 'lucide-react'

export default function PersonasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-primary" />
          Persona Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage AI personas and their configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Personas</CardTitle>
          <CardDescription>
            View and manage all AI personas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Persona management functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
