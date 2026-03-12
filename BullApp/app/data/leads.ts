export interface LeadType {
  id: number;
  farmer_name: string;
  phone: string;
  district: string;
  taluka: string;
  village: string;
  campaign_name?: string;
  status: "NEW" | "ASSIGNED" | "CONTACTED" | "VISIT_REQUESTED" | "VISIT_ASSIGNED" | "VISIT_COMPLETED";
  created_at: string;
  notes?: string;
  assigned_ground_executive?: string;
}

export interface TelecallerType {
  id: number;
  name: string;
}

export interface GroundExecutiveType {
  id: number;
  name: string;
}

const telecallers: TelecallerType[] = [
  { id: 1, name: "Telecaller 56" },
  { id: 2, name: "Priya Singh" },
  { id: 3, name: "Amit Patel" },
  { id: 4, name: "Deepa Sharma" },
  { id: 5, name: "Vikram Yadav" },
];

const groundExecutives: GroundExecutiveType[] = [
  { id: 1, name: "Rajesh Kumar" },
  { id: 2, name: "Mohan Singh" },
  { id: 3, name: "Sunil Verma" },
  { id: 4, name: "Anil Rao" },
  { id: 5, name: "Rakesh Nair" },
];

let leads: LeadType[] = [
  {
    id: 1,
    farmer_name: "Ramesh Patel",
    phone: "9876543210",
    district: "Ahmedabad",
    taluka: "Sanand",
    village: "Navagam",
    campaign_name: "Kharif Campaign",
    status: "NEW",
    created_at: new Date().toISOString(),
    notes: "",
    assigned_ground_executive: undefined,
  },
  {
    id: 2,
    farmer_name: "Suresh Yadav",
    phone: "9898989898",
    district: "Mehsana",
    taluka: "Visnagar",
    village: "Kansa",
    campaign_name: "Cotton Drive",
    status: "VISIT_ASSIGNED",
    created_at: new Date().toISOString(),
    notes: "Initial contact completed, ready for field visit",
    assigned_ground_executive: "Rajesh Kumar",
  },
  {
    id: 3,
    farmer_name: "Mahesh Kumar",
    phone: "9765432109",
    district: "Gandhinagar",
    taluka: "Kalol",
    village: "Rampura",
    campaign_name: "Hybrid Seeds Campaign",
    status: "NEW",
    created_at: new Date().toISOString(),
    notes: "",
    assigned_ground_executive: undefined,
  },
  {
    id: 4,
    farmer_name: "Vijay Singh",
    phone: "9812345678",
    district: "Banaskantha",
    taluka: "Deesa",
    village: "Devpura",
    campaign_name: "Fertilizer Awareness",
    status: "ASSIGNED",
    created_at: new Date().toISOString(),
    notes: "",
    assigned_ground_executive: undefined,
  },
  {
    id: 5,
    farmer_name: "Arjun Desai",
    phone: "9901234567",
    district: "Banaskantha",
    taluka: "Palanpur",
    village: "Kanodar",
    campaign_name: "Kharif Campaign",
    status: "VISIT_REQUESTED",
    created_at: new Date().toISOString(),
    notes: "Customer requested visit for checking soil quality",
    assigned_ground_executive: undefined,
  },
  {
    id: 6,
    farmer_name: "Priya Sharma",
    phone: "9876501234",
    district: "Ahmedabad",
    taluka: "Sanand",
    village: "Bavla",
    campaign_name: "Cotton Drive",
    status: "VISIT_REQUESTED",
    created_at: new Date().toISOString(),
    notes: "Wants to discuss current crop status",
    assigned_ground_executive: undefined,
  },
];

export function getLeads(): LeadType[] {
  return [...leads];
}

export function addLead(newLead: Omit<LeadType, "id">) {
  const lead: LeadType = {
    id: Date.now(),
    ...newLead,
  };

  leads.unshift(lead);
}

export function getTelecallers(): TelecallerType[] {
  return [...telecallers];
}

export function assignTelecaller(leadId: number): void {
  const lead = leads.find((l) => l.id === leadId);
  if (lead) {
    lead.status = "ASSIGNED";
  }
}

export function updateLeadStatus(
  leadId: number,
  status: "CONTACTED" | "VISIT_REQUESTED",
  notes?: string
): void {
  const lead = leads.find((l) => l.id === leadId);
  if (lead) {
    lead.status = status;
    if (notes) {
      lead.notes = (lead.notes ? lead.notes + "\n" : "") + notes;
    }
  }
}

export function getGroundExecutives(): GroundExecutiveType[] {
  return [...groundExecutives];
}

export function assignGroundExecutive(leadId: number, executiveName: string): void {
  const lead = leads.find((l) => l.id === leadId);
  if (lead) {
    lead.status = "VISIT_ASSIGNED";
    lead.assigned_ground_executive = executiveName;
  }
}

export function completeVisit(leadId: number, completionNotes?: string): void {
  const lead = leads.find((l) => l.id === leadId);
  if (lead) {
    lead.status = "VISIT_COMPLETED";
    if (completionNotes) {
      lead.notes = (lead.notes ? lead.notes + "\n" : "") + `[VISIT COMPLETED]: ${completionNotes}`;
    }
  }
}
