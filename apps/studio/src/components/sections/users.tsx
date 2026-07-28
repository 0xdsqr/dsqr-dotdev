import { Badge } from "@dsqr-dotdev/react/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsqr-dotdev/react/components/ui/card"
import { DataTable } from "@dsqr-dotdev/react/components/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dsqr-dotdev/react/components/ui/select"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"
import { toast } from "sonner"
import { trpcClient } from "../../lib/trpc"
import type { AdminUser } from "../../lib/studio"
import { getErrorMessage, normalizeRole } from "../../lib/studio"
import { TableHeaderButton } from "../studio-ui"

export function UsersSection({ users }: { users: AdminUser[] }) {
  const router = useRouter()

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      trpcClient.auth.updateUserRole.mutate({ userId, role }),
    onSuccess: async () => {
      toast.success("User role updated.")
      await router.invalidate()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update user role."))
    },
  })

  const userColumns = useMemo<Array<ColumnDef<AdminUser>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <TableHeaderButton
            label="name"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name || "—"}</span>,
      },
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
        accessorKey: "role",
        header: ({ column }) => (
          <TableHeaderButton
            label="role"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const user = row.original

          return (
            <Select
              value={normalizeRole(user.role)}
              onValueChange={(value) => {
                if (value !== "admin" && value !== "user") {
                  return
                }

                if (value === normalizeRole(user.role)) {
                  return
                }

                updateUserRoleMutation.mutate({ userId: user.id, role: value })
              }}
            >
              <SelectTrigger className="w-[140px]" disabled={updateUserRoleMutation.isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
      {
        accessorKey: "emailVerified",
        header: ({ column }) => (
          <TableHeaderButton
            label="verified"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
            {row.original.emailVerified ? "verified" : "pending"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="created"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
    ],
    [updateUserRoleMutation],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-lg">users</CardTitle>
        <CardDescription>
          Only admin users should have access to Studio. Role changes save immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={userColumns}
          data={users}
          searchColumn="email"
          searchPlaceholder="Search by email"
          emptyMessage="No users found."
        />
      </CardContent>
    </Card>
  )
}
