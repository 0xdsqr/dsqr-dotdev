"use client"

import { Camera, Loader2, X } from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"
import { authClient } from "@/auth/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { trpcClient } from "@/lib/trpc"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  username?: string
  avatarUrl?: string
  onSave?: (data: {
    username: string
    avatarUrl?: string
  }) => void | Promise<void>
}

type Tab = "profile" | "settings"

export function SettingsModal({
  open,
  onOpenChange,
  email,
  username: initialUsername = "",
  avatarUrl: initialAvatarUrl,
  onSave: _onSave,
}: SettingsModalProps) {
  const [_activeTab, _setActiveTab] = useState<Tab>("profile")
  const [username, setUsername] = useState(initialUsername)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    initialAvatarUrl,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = (e.target?.result as string)?.split(",")[1] || ""

          const fileName = `${Date.now()}-${file.name}`
          const result = await trpcClient.auth.uploadAvatar.mutate({
            fileData: base64Data,
            fileName,
            fileType: file.type,
          })

          setAvatarUrl(result.url)
        } catch (_error) {
          alert("Failed to upload image")
          setPreviewUrl(null)
        } finally {
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        alert("Failed to read image file")
        setPreviewUrl(null)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (_error) {
      alert("Failed to prepare image")
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await trpcClient.auth.updateProfile.mutate({
        name: username || undefined,
        image: avatarUrl || undefined,
      })

      await authClient.refetch()

      onOpenChange(false)
    } catch (_error) {
      alert("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveImage = () => {
    setAvatarUrl(undefined)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayAvatar = previewUrl || avatarUrl
  const displayName = username || email

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="flex flex-col h-screen max-h-[80vh]">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h2 className="text-lg font-bold font-mono">profile</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                manage your account
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-mono">profile picture</Label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-16 w-16 !rounded border-4 border-purple-600 dark:border-purple-400">
                    {displayAvatar && (
                      <AvatarImage
                        src={displayAvatar || "/placeholder.svg"}
                        alt={displayName}
                      />
                    )}
                    <AvatarFallback className="bg-purple-600 dark:bg-purple-500 text-white text-lg !rounded">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>

                  {displayAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-3 w-3" />
                        {displayAvatar ? "change photo" : "upload photo"}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground font-mono">
                    jpg, png or gif. max 5mb
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-mono">
                username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={email}
                className="text-sm font-mono max-w-md"
              />
              <p className="text-xs text-muted-foreground font-mono">
                this is your public display name
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-mono">
                email
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="text-sm font-mono bg-muted max-w-md"
              />
              <p className="text-xs text-muted-foreground font-mono">
                email cannot be changed
              </p>
            </div>
          </div>

          <div className="border-t border-border p-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted transition-colors"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="px-3 py-1.5 text-xs font-mono bg-primary text-primary-foreground border border-primary rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  saving...
                </>
              ) : (
                "save changes"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
