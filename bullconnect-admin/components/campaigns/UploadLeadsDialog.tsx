"use client"

import { useState } from "react"
import { UploadCloud, FileText } from "lucide-react"

import { useUploadCampaignCsv } from "@/hooks/useUploadCampaignCsv"
import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"

export default function UploadLeadsDialog({
  campaignId,
}: {
  campaignId: string
}) {

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const uploadMutation = useUploadCampaignCsv(campaignId)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const selected = e.target.files?.[0]

    if (selected) {
      setFile(selected)
    }

  }

  const handleDrop = (
    e: React.DragEvent<HTMLLabelElement>
  ) => {

    e.preventDefault()

    const dropped = e.dataTransfer.files?.[0]

    if (dropped) {
      setFile(dropped)
    }

  }

  const handleDragOver = (
    e: React.DragEvent<HTMLLabelElement>
  ) => {

    e.preventDefault()

  }

  const handleUpload = async () => {

    if (!file) {
      alert("Please select a CSV file")
      return
    }

    try {

      const result = await uploadMutation.mutateAsync(file)

      alert(`Upload Complete

Total: ${result.totalRows}
Inserted: ${result.inserted}
Duplicates: ${result.duplicates}
Invalid: ${result.invalid}`)

      setFile(null)
      setOpen(false)

    } catch (err) {

      console.error(err)
      alert("Upload failed")

    }

  }

  return (

    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>

        <Button
          variant="outline"
          size="sm"
        >
          Upload Leads
        </Button>

      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">

        <DialogHeader>

          <DialogTitle>
            Upload Leads CSV
          </DialogTitle>

          <DialogDescription>
            Upload farmer leads in CSV format for this campaign.
          </DialogDescription>

        </DialogHeader>

        <div className="space-y-4">

          {/* DROPZONE */}

          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="
              flex flex-col items-center justify-center gap-2
              border-2 border-dashed rounded-lg p-6
              cursor-pointer
              hover:bg-muted hover:border-primary
              transition-all duration-200
            "
          >

            <UploadCloud
              className="
                h-8 w-8 text-muted-foreground
                transition-transform
                group-hover:scale-110
              "
            />

            <span className="text-sm font-medium">
              Click or drag CSV here
            </span>

            <span className="text-xs text-muted-foreground">
              Supported format: .csv
            </span>

            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

          </label>

          {/* FILE PREVIEW */}

          {file && (

            <div
              className="
                flex items-center justify-between
                bg-muted rounded-md p-3
              "
            >

              <div className="flex items-center gap-3">

                <FileText className="h-5 w-5 text-primary" />

                <div className="text-sm">

                  <p className="font-medium">
                    {file.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>

                </div>

              </div>

              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setFile(null)}
              >
                Replace
              </button>

            </div>

          )}

          {/* UPLOAD BUTTON */}

          <Button
            className="w-full"
            disabled={!file || uploadMutation.isPending}
            onClick={handleUpload}
          >

            {uploadMutation.isPending
              ? "Uploading..."
              : "Upload Leads"}

          </Button>

        </div>

      </DialogContent>

    </Dialog>

  )

}