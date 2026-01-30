import { Badge } from "@dsqr-dotdev/ui/components/badge"
import { Button } from "@dsqr-dotdev/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dsqr-dotdev/ui/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsqr-dotdev/ui/components/table"
import { createFileRoute } from "@tanstack/react-router"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  MonitorUp,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Power,
  RotateCcw,
  Terminal,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/_authenticated/homelab/")({
  component: HomelabPage,
})

type VMStatus = "running" | "stopped" | "paused"

interface VM {
  vmid: number
  name: string
  status: VMStatus
  node: string
  cores: number
  memoryMB: number
  diskGB: number
  uptimeSeconds: number | null
  ip: string | null
}

// Mock data -- will be replaced with Proxmox API
const MOCK_VMS: VM[] = [
  {
    vmid: 100,
    name: "haproxy",
    status: "running",
    node: "pve",
    cores: 2,
    memoryMB: 2048,
    diskGB: 32,
    uptimeSeconds: 1_296_000,
    ip: "192.168.50.10",
  },
  {
    vmid: 101,
    name: "k3s-master-01",
    status: "running",
    node: "pve",
    cores: 4,
    memoryMB: 8192,
    diskGB: 100,
    uptimeSeconds: 1_296_000,
    ip: "192.168.50.20",
  },
  {
    vmid: 102,
    name: "k3s-worker-01",
    status: "running",
    node: "pve",
    cores: 4,
    memoryMB: 16384,
    diskGB: 200,
    uptimeSeconds: 1_296_000,
    ip: "192.168.50.21",
  },
  {
    vmid: 103,
    name: "k3s-worker-02",
    status: "running",
    node: "pve",
    cores: 4,
    memoryMB: 16384,
    diskGB: 200,
    uptimeSeconds: 1_296_000,
    ip: "192.168.50.22",
  },
  {
    vmid: 104,
    name: "postgres-primary",
    status: "running",
    node: "pve",
    cores: 2,
    memoryMB: 4096,
    diskGB: 120,
    uptimeSeconds: 864_000,
    ip: "192.168.50.30",
  },
  {
    vmid: 105,
    name: "rustfs",
    status: "running",
    node: "pve",
    cores: 2,
    memoryMB: 4096,
    diskGB: 500,
    uptimeSeconds: 864_000,
    ip: "192.168.50.27",
  },
  {
    vmid: 110,
    name: "dev-sandbox",
    status: "stopped",
    node: "pve",
    cores: 2,
    memoryMB: 4096,
    diskGB: 64,
    uptimeSeconds: null,
    ip: null,
  },
  {
    vmid: 111,
    name: "windows-11",
    status: "paused",
    node: "pve",
    cores: 4,
    memoryMB: 8192,
    diskGB: 128,
    uptimeSeconds: 3600,
    ip: "192.168.50.50",
  },
]

function formatUptime(seconds: number | null): string {
  if (seconds === null) return "--"
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
  return `${mb} MB`
}

const statusConfig: Record<
  VMStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  running: { label: "Running", variant: "default" },
  stopped: { label: "Stopped", variant: "secondary" },
  paused: { label: "Paused", variant: "outline" },
}

function HomelabPage() {
  const vms = MOCK_VMS
  const runningCount = vms.filter((v) => v.status === "running").length
  const totalCores = vms.reduce((sum, v) => sum + v.cores, 0)
  const totalMemory = vms.reduce((sum, v) => sum + v.memoryMB, 0)
  const totalDisk = vms.reduce((sum, v) => sum + v.diskGB, 0)

  return (
    <>
      <SiteHeader
        breadcrumbs={[{ label: "Homelab" }, { label: "Virtual Machines" }]}
        actions={
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create VM
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Virtual Machines
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dell R730xd &middot; Proxmox VE
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            icon={MonitorUp}
            label="VMs"
            value={`${runningCount}/${vms.length}`}
            sub="running"
          />
          <SummaryCard
            icon={Cpu}
            label="Total vCPUs"
            value={`${totalCores}`}
            sub="allocated"
          />
          <SummaryCard
            icon={MemoryStick}
            label="Total RAM"
            value={formatMemory(totalMemory)}
            sub="allocated"
          />
          <SummaryCard
            icon={HardDrive}
            label="Total Disk"
            value={`${totalDisk} GB`}
            sub="provisioned"
          />
        </div>

        {/* VM table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">VMID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Node</TableHead>
                <TableHead className="text-right">vCPUs</TableHead>
                <TableHead className="text-right">RAM</TableHead>
                <TableHead className="text-right">Disk</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vms.map((vm) => {
                const status = statusConfig[vm.status]
                return (
                  <TableRow key={vm.vmid}>
                    <TableCell className="font-mono text-muted-foreground">
                      {vm.vmid}
                    </TableCell>
                    <TableCell className="font-medium">{vm.name}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vm.node}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vm.cores}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMemory(vm.memoryMB)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vm.diskGB} GB
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {vm.ip || "--"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatUptime(vm.uptimeSeconds)}
                    </TableCell>
                    <TableCell>
                      <VMActions vm={vm} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Proxmox API integration coming soon. Data shown is mocked.
          </p>
        </div>
      </div>
    </>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function VMActions({ vm }: { vm: VM }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {vm.status === "stopped" ? (
          <DropdownMenuItem disabled>
            <Play className="mr-2 h-4 w-4" />
            Start
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem disabled>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart
            </DropdownMenuItem>
            {vm.status === "running" && (
              <DropdownMenuItem disabled>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuItem disabled>
          <Terminal className="mr-2 h-4 w-4" />
          Console
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-destructive">
          <Power className="mr-2 h-4 w-4" />
          {vm.status === "stopped" ? "Delete" : "Force Stop"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
