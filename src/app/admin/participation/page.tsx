import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ParticipationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Participation Log
        </h1>
        <p className="text-muted-foreground mt-1">
          View and analyze user participation data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Participation Logs</CardTitle>
          <CardDescription>
            View and analyze all user participation records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Participation log functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
