import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import * as pulumi from "@pulumi/pulumi"

import { resolveVmSpec, type VmDefaults, type VmSpec } from "@dsqr-dotdev/infra-model"
import { transformResourceArgs, type Transform } from "@dsqr-dotdev/effect-pulumi-core"

export type ProxmoxVmTransforms = {
  vm?: Transform<proxmox.vm.VirtualMachineArgs, pulumi.CustomResourceOptions>
}

function firstIpv4Address(addresses: unknown): string | null {
  if (!Array.isArray(addresses)) {
    return null
  }

  for (const interfaceAddresses of addresses) {
    if (!Array.isArray(interfaceAddresses)) {
      continue
    }

    const primaryAddress = interfaceAddresses.find(
      (address): address is string => typeof address === "string" && address.length > 0,
    )

    if (primaryAddress && primaryAddress !== "127.0.0.1") {
      return primaryAddress
    }
  }

  return null
}

export function createProxmoxVm(args: {
  spec: VmSpec
  provider: proxmox.Provider
  defaults: VmDefaults
  transform?: ProxmoxVmTransforms
}) {
  const { spec, provider, defaults } = args
  const resolvedSpec = resolveVmSpec(spec, defaults)

  return new proxmox.vm.VirtualMachine(
    ...transformResourceArgs(
      args.transform?.vm,
      resolvedSpec.resourceName,
      {
        name: resolvedSpec.name,
        nodeName: resolvedSpec.nodeName,
        vmId: resolvedSpec.vmId,
        tags: [...resolvedSpec.tags],
        agent: {
          enabled: true,
          type: "virtio",
          waitForIp: {
            ipv4: true,
          },
        },
        cpu: {
          cores: resolvedSpec.cpuCores,
          sockets: 1,
        },
        memory: {
          dedicated: resolvedSpec.memoryMiB,
        },
        started: true,
        onBoot: true,
        clone: {
          nodeName: resolvedSpec.nodeName,
          vmId: resolvedSpec.templateVmId,
          full: true,
          datastoreId: resolvedSpec.datastoreId,
        },
        initialization: {
          datastoreId: resolvedSpec.cloudInitDiskDatastoreId,
          interface: "ide2",
          type: "nocloud",
          userDataFileId: resolvedSpec.cloudInitUserDataFileId,
          ipConfigs: [
            {
              ipv4: {
                address: "dhcp",
              },
            },
          ],
        },
        disks: [
          {
            interface: "scsi0",
            datastoreId: resolvedSpec.datastoreId,
            size: resolvedSpec.rootDiskSizeGiB,
          },
        ],
        networkDevices: [
          {
            bridge: resolvedSpec.bridge,
            model: "virtio",
            ...(resolvedSpec.macAddress === undefined
              ? {}
              : { macAddress: resolvedSpec.macAddress }),
            ...(resolvedSpec.vlanTag === undefined ? {} : { vlanId: resolvedSpec.vlanTag }),
          },
        ],
      },
      {
        ignoreChanges: ["disks[0].speed"],
        provider,
      },
    ),
  )
}

export function describeVm(vm: proxmox.vm.VirtualMachine) {
  return {
    id: vm.id,
    name: vm.name,
    ipv4Addresses: vm.ipv4Addresses,
    primaryIpv4: vm.ipv4Addresses.apply(firstIpv4Address),
    nodeName: vm.nodeName,
    status: pulumi.output(vm.started).apply((started) => (started ? "running" : "stopped")),
  }
}
