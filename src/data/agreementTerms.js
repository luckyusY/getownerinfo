// Listing agreement wording, kept free of server-only imports so the signing
// step in the wizard can render exactly the clauses the server records.
//
// Bumping AGREEMENT_VERSION keeps previously signed records pointing at the
// text that was actually agreed to.

export const AGREEMENT_VERSION = "2026-10-A1";

export const AGREEMENT_TERMS = {
  A: [
    "I confirm I am the lawful owner of this property or asset, or I am formally authorised to list it on the owner's behalf.",
    "I grant getownerinfo an exclusive listing mandate for the exclusivity period stated below. During that period I will not list this same property or asset on a competing platform or through another agent.",
    "I will not be charged a listing fee. Instead, a commission at the rate stated below becomes payable to getownerinfo if a deal is concluded with a buyer or tenant introduced through this platform.",
    "I will report the outcome of any deal truthfully and promptly, including the final agreed amount and the completion date.",
    "I understand that under-reporting a deal, repeatedly marking introduced deals as 'not concluded', or concluding a deal off-platform to avoid commission may result in penalties, suspension, or blacklisting.",
    "Commission is calculated on the final reported amount and is payable by the due date on the invoice getownerinfo issues.",
  ],
  B: [
    "I confirm I am the lawful owner of this property or asset, or I am formally authorised to list it on the owner's behalf.",
    "I am paying a listing fee for the duration stated below. The fee is for publication only and does not guarantee a sale, rental, or any particular level of interest.",
    "The listing fee is VAT-inclusive and is non-refundable once the listing has been approved and published.",
    "My listing will be reviewed before publication and may be rejected if the information or ownership proof is incomplete or inaccurate.",
    "I will keep the listing accurate and will mark it as sold, rented, or withdrawn promptly once it is no longer available.",
    "No commission is payable on a deal concluded from this listing.",
  ],
};
