	•	leads.state is the single source of truth
	•	A lead can have only one active tele_assignment
	•	A field_request can be assigned only once
	•	A lead cannot move backward in state
	•	State changes must happen inside a transaction
	•	No table other than leads stores workflow state