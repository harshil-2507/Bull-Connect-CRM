"use client"

import { useLead } from "@/hooks/useLead"
import { useParams } from "next/navigation"

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "-"}</p>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-6">{children}</div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const { data, isLoading } = useLead(params.id as string)

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold">
          {data?.farmer_name}
        </h1>
      </div>

      {/* FARMER INFO */}

      <Section title="Farmer Information">

        <Field label="Phone" value={data?.phone_number} />

        <Field label="Alternate Phone" value={data?.alternate_phone} />

        <Field label="Farmer Type" value={data?.farmer_type} />

        <Field label="Farmer ID" value={data?.farmer_id} />

        <Field label="Source" value={data?.source} />

        <Field label="Product Type" value={data?.product_type} />

        <Field label="Total Land (Bigha)" value={data?.total_land_bigha} />

        <Field label="Remarks" value={data?.experience_or_remarks} />

      </Section>

      {/* LOCATION */}

      <Section title="Location">

        <Field label="Village" value={data?.village} />

        <Field label="Taluka" value={data?.taluka} />

        <Field label="District" value={data?.district} />

        <Field label="Bull Centre" value={data?.bull_centre} />

      </Section>

      {/* CASTOR DEAL */}

      <Section title="Castor Deal">

        <Field label="Bori" value={data?.castor_bori} />

        <Field label="Expected Price" value={data?.castor_expected_price} />

        <Field label="Offered Price" value={data?.castor_offered_price} />

        <Field
          label="Harvest Time"
          value={data?.castor_expected_harvest_time}
        />

        <Field
          label="Vavetar (Bigha)"
          value={data?.castor_vavetar_bigha}
        />

        <Field
          label="Intent To Sell"
          value={data?.castor_intent_to_sell}
        />

        <Field
          label="Deal Status"
          value={data?.castor_deal_status}
        />

      </Section>

      {/* GROUNDNUT DEAL */}

      <Section title="Groundnut Deal">

        <Field label="Bori" value={data?.groundnut_bori} />

        <Field
          label="Expected Price"
          value={data?.groundnut_expected_price}
        />

        <Field
          label="Offered Price"
          value={data?.groundnut_offered_price}
        />

        <Field
          label="Harvest Time"
          value={data?.groundnut_expected_harvest_time}
        />

        <Field
          label="Vavetar (Bigha)"
          value={data?.groundnut_vavetar_bigha}
        />

        <Field
          label="Intent To Sell"
          value={data?.groundnut_intent_to_sell}
        />

      </Section>

    </div>
  )
}