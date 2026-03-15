import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useUploadCampaignCsv(campaignId: string) {

  return useMutation({

    mutationFn: async (file: File) => {

      const formData = new FormData()

      // backend expects field name "file"
      formData.append("file", file)

      const res = await api.post(
        `/campaigns/${campaignId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      return res.data
    }

  })

}