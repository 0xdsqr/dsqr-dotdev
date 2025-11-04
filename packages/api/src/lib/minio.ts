import { Client } from "minio"

function parseEndpoint(endpoint: string) {
  try {
    const url = new URL(
      endpoint.startsWith("http") ? endpoint : `http://${endpoint}`,
    )
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 9000,
    }
  } catch {
    return {
      host: endpoint.split(":")[0],
      port: parseInt(endpoint.split(":")[1] || "9000", 10),
    }
  }
}

const endpointConfig = parseEndpoint(
  process.env.MINIO_ENDPOINT || "192.168.50.27:9000",
)

const minioClient = new Client({
  endPoint: endpointConfig.host,
  port: endpointConfig.port,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
})

export async function uploadAvatarToMinIO(
  userId: string,
  file: Buffer,
  fileName: string,
  fileType: string,
) {
  const bucketName = process.env.MINIO_BUCKET || "dsqr-dotdev"
  const objectName = `${userId}/${fileName}`

  try {
    await minioClient.putObject(bucketName, objectName, file, file.length, {
      "Content-Type": fileType,
    })

    const cdnUrl = `${process.env.CDN_URL || "https://cdn.dsqr.dev"}/${userId}/${fileName}`
    return cdnUrl
  } catch (_error) {
    throw new Error("Failed to upload image to MinIO")
  }
}
