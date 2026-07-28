import { Badge } from "@dsqr-dotdev/react/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsqr-dotdev/react/components/ui/card"
import { DataTable } from "@dsqr-dotdev/react/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"
import type { AdminSubscriber } from "../../lib/studio"
import { TableHeaderButton } from "../studio-ui"

export function SubscribersSection({ subscribers }: { subscribers: AdminSubscriber[] }) {
  const subscriberColumns = useMemo<Array<ColumnDef<AdminSubscriber>>>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <TableHeaderButton
            label="email"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span>,
      },
      {
        accessorKey: "active",
        header: ({ column }) => (
          <TableHeaderButton
            label="status"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "default" : "secondary"}>
            {row.original.active ? "active" : "inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "subscribedAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="subscribed"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.subscribedAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        accessorKey: "unsubscribedAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="unsubscribed"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.unsubscribedAt
              ? formatDistanceToNow(new Date(row.original.unsubscribedAt), { addSuffix: true })
              : "—"}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-lg">subscribers</CardTitle>
        <CardDescription>Current newsletter signups and subscription state.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={subscriberColumns}
          data={subscribers}
          searchColumn="email"
          searchPlaceholder="Search subscribers"
          emptyMessage="No subscribers found."
        />
      </CardContent>
    </Card>
  )
}
