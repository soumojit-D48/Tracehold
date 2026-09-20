permit (
    principal,
    action == Action::"CreateTicket",
    resource
)
when { principal.role == "TENANT" || principal.role == "ADMIN" };

permit (
    principal,
    action == Action::"ViewTicket",
    resource
)
when {
    principal.role == "ADMIN" ||
    principal.role == "LANDLORD" ||
    (principal.role == "TENANT" && resource.createdBy == principal) ||
    (principal.role == "CONTRACTOR" && resource.assignedTo == principal)
};

permit (
    principal,
    action == Action::"UpdateTicket",
    resource
)
when {
    principal.role == "ADMIN" ||
    principal.role == "LANDLORD" ||
    (principal.role == "TENANT" && resource.createdBy == principal) ||
    (principal.role == "CONTRACTOR" && resource.assignedTo == principal)
};

permit (
    principal,
    action == Action::"CloseTicket",
    resource
)
when { principal.role == "ADMIN" || principal.role == "LANDLORD" };

permit (
    principal,
    action == Action::"AddRepairNote",
    resource
)
when { principal.role == "ADMIN" || principal.role == "CONTRACTOR" };

permit (
    principal,
    action == Action::"GenerateEvidence",
    resource
)
when { principal.role == "ADMIN" || principal.role == "LANDLORD" };

permit (
    principal,
    action == Action::"SetDemoClock",
    resource
)
when { principal.role == "ADMIN" };

permit (
    principal,
    action == Action::"EvaluateEscalations",
    resource
)
when { principal.role == "ADMIN" };