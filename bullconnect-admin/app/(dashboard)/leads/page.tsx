"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import LeadsTable from "@/components/leads/LeadsTable"
import LeadsToolbar from "@/components/leads/LeadsToolbar"
import LeadsSkeleton from "@/components/leads/LeadsSkeleton"
import MultiSelectFilterOverlay from "@/components/leads/MultiSelectFilterOverlay"
import BulkActionBar from "@/components/leads/BulkActionBar"
import LeadPreviewPanel from "@/components/leads/LeadPreviewPanel"

import { useInfiniteLeads } from "@/hooks/useInfiniteLeads"
import { Button } from "@/components/ui/button"
import { Lead } from "@/types/leads"

export default function LeadsPage() {

  const router = useRouter()

  const [search,setSearch] = useState("")
  const [statusTab,setStatusTab] = useState("ALL")

  const [sortBy,setSortBy] = useState("created_at")
  const [sortDir,setSortDir] = useState<"asc"|"desc">("desc")

  const [filters,setFilters] = useState({
    village: [] as string[],
  })

  const [activeFilter,setActiveFilter] = useState<null|"village">(null)

  const [selected,setSelected] = useState<string[]>([])
  const [previewLead,setPreviewLead] = useState<Lead | null>(null)

  const toggleSelect = (id:string)=>{

    if(selected.includes(id)){
      setSelected(selected.filter(i=>i!==id))
    }else{
      setSelected([...selected,id])
    }

  }

  const clearSelection = ()=>{
    setSelected([])
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteLeads()

  const observer = useRef<IntersectionObserver | null>(null)

  const lastRowRef = useCallback((node:HTMLTableRowElement|null)=>{

    if(isFetchingNextPage) return

    if(observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries=>{

      const first = entries[0]

      if(first?.isIntersecting && hasNextPage){
        fetchNextPage()
      }

    })

    if(node) observer.current.observe(node)

  },[fetchNextPage,hasNextPage,isFetchingNextPage])

  if(isLoading) return <LeadsSkeleton/>

  let leads =
    data?.pages?.flatMap((p:any)=>
      Array.isArray(p) ? p : p.leads
    ) ?? []

  if(search){

    leads = leads.filter((l:any)=>
      l.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone_number.includes(search)
    )

  }

  if(statusTab!=="ALL"){
    leads = leads.filter((l:any)=>l.status===statusTab)
  }

  if(filters.village.length>0){

    leads = leads.filter((l:any)=>
      filters.village.includes(l.village)
    )

  }

  leads = [...leads].sort((a:any,b:any)=>{

    const valA = a[sortBy]
    const valB = b[sortBy]

    if(sortDir==="asc") return valA>valB ? 1 : -1
    return valA<valB ? 1 : -1

  })

  const toggleSort=(field:string)=>{

    if(sortBy===field){
      setSortDir(sortDir==="asc"?"desc":"asc")
    }else{
      setSortBy(field)
      setSortDir("asc")
    }

  }

  const villages = [
    ...new Set(leads.map((l:any)=>l.village).filter(Boolean))
  ]

  return(

    <div className="flex flex-col h-full px-6 py-4">

      <div className="flex items-center justify-between mb-4">

        <h1 className="text-2xl font-semibold">
          Leads
        </h1>

        <Button onClick={()=>router.push("/leads/new")}>
          Create Lead
        </Button>

      </div>

      <LeadsToolbar
        search={search}
        setSearch={setSearch}
        status={statusTab}
        setStatus={setStatusTab}
      />

      <div className="flex-1 mt-4">

        <LeadsTable
          leads={leads}
          toggleSort={toggleSort}
          lastRowRef={lastRowRef}
          filters={filters}
          openVillageFilter={()=>setActiveFilter("village")}
          selected={selected}
          toggleSelect={toggleSelect}
          onPreview={(lead)=>setPreviewLead(lead)}
        />

      </div>

      <BulkActionBar
        selectedCount={selected.length}
        onClear={clearSelection}
      />

      {activeFilter==="village" &&(

        <MultiSelectFilterOverlay
          title="Village"
          options={villages}
          selected={filters.village}
          onApply={(values)=>
            setFilters({...filters,village:values})
          }
          onClose={()=>setActiveFilter(null)}
        />

      )}

      {previewLead && (

        <LeadPreviewPanel
          lead={previewLead}
          onClose={()=>setPreviewLead(null)}
        />

      )}

    </div>

  )

}