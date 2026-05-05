import { Schema } from "effect"

export const VmSpecSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  resourceName: Schema.optional(Schema.NonEmptyString),
  vmId: Schema.Number,
  nodeName: Schema.NonEmptyString,
  templateVmId: Schema.Number,
  datastoreId: Schema.NonEmptyString,
  bridge: Schema.NonEmptyString,
  vlanTag: Schema.optional(Schema.Number),
  cloudInitDiskDatastoreId: Schema.NonEmptyString,
  cloudInitUserDataFileId: Schema.NonEmptyString,
  cpuCores: Schema.optional(Schema.Number),
  memoryMiB: Schema.optional(Schema.Number),
  rootDiskSizeGiB: Schema.optional(Schema.Number),
  tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
})

export const VmDefaultsSchema = Schema.Struct({
  cpuCores: Schema.Number,
  memoryMiB: Schema.Number,
  rootDiskSizeGiB: Schema.Number,
  tags: Schema.Array(Schema.NonEmptyString),
})

export const VmInventorySchema = Schema.Record({
  key: Schema.NonEmptyString,
  value: VmSpecSchema,
})

export const decodeVmDefaults = Schema.decodeUnknownSync(VmDefaultsSchema, {
  onExcessProperty: "error",
})

export const decodeVmInventory = Schema.decodeUnknownSync(VmInventorySchema, {
  onExcessProperty: "error",
})
