import { P2PPacket } from './types';

export const SAMPLE_PACKETS: P2PPacket[] = [
  {
    id: 'packet-success-hardware',
    title: 'Hardware Procurement - Match Approved',
    description: 'A clean hardware order matching all quantities, pricing schedules, and receipt records.',
    invoice: {
      name: 'INV-2026-904.txt',
      type: 'invoice',
      mimeType: 'text/plain',
      fileSize: '1.2 KB',
      content: `--- VENDOR INVOICE ---
Invoice Number: INV-2026-904
Invoice Date: 2026-05-15
Vendor: Apex Systems Inc.
Bill To: Enterprise Corp Inc., Accounts Payable Dept
Purchase Order Reference: PO-998811

LINE ITEMS:
1. Enterprise Rack Server v5
   Qty: 5 units
   Unit Price: $2,400.00
   Total Price: $12,000.00

2. Cat6 Patch Cables (10m pack)
   Qty: 10 packs
   Unit Price: $45.00
   Total Price: $450.00

Total Due: $12,450.00
Payment Terms: Net 30, per Contract Clause (Payment Terms Section V.a)`
    },
    po: {
      name: 'PO-998811.txt',
      type: 'po',
      mimeType: 'text/plain',
      fileSize: '1.1 KB',
      content: `--- PURCHASE ORDER ---
PO Number: PO-998811
PO Date: 2026-05-01
Vendor: Apex Systems Inc.
Buyer: Enterprise Corp Inc.

LINE ITEMS:
1. Enterprise Rack Server v5
   Qty: 5 units
   Unit Price: $2,400.00
   Total Price: $12,000.00

2. Cat6 Patch Cables (10m pack)
   Qty: 10 packs
   Unit Price: $45.00
   Total Price: $450.00

Authorized Signature: Sarah Jenkins, Purchasing Director`
    },
    receipt: {
      name: 'GRN-88741-Receipt.txt',
      type: 'receipt',
      mimeType: 'text/plain',
      fileSize: '0.9 KB',
      content: `--- GOODS RECEIPT NOTE ---
Receipt Number: GRN-88741
Receipt Date: 2026-05-08
Received By: Mark Delgado, Warehouse Logistics Team
PO Reference: PO-998811

ITEMS RECEIVED:
1. Enterprise Rack Server v5
   Qty Delivered: 5 units
   Condition: Brand new, undamaged packaging. Passed power-on test.

2. Cat6 Patch Cables (10m pack)
   Qty Delivered: 10 packs
   Condition: Factory seal intact.

Status: All requested goods physically received and verified.`
    },
    contract: {
      name: 'SOP-Apex-Master-Agreement.txt',
      type: 'contract',
      mimeType: 'text/plain',
      fileSize: '2.4 KB',
      content: `--- MASTER SERVICES AGREEMENT ---
Contract ID: MSA-2025-APEX-09
Effective Date: 2025-10-01
Parties: Enterprise Corp Inc. & Apex Systems Inc.

Contract Clauses:
Section (Pricing Schedule):
Enterprise Server Equipment line purchases are governed by standard volume tier 2 rates:
- Enterprise Rack Server v5: fixed price of $2,400.00 per unit.
- Cat6 Patch Cables: fixed price of $45.00 per 10m pack.

Section V.a (Payment Terms):
All invoices submitted under this agreement shall be billed with payment terms of Net 30 days from invoice date.

Section XII (SOP & Rules):
Any pricing conflict between Purchase Orders and Invoice rate shall default to this master schedule unless a formal amendment is authorized.`
    }
  },
  {
    id: 'packet-price-discrepancy',
    title: 'Office Seating Order - Price Discrepancy',
    description: 'A mismatched packet where the invoice has billed higher prices than contract agreements and PO authorizations.',
    invoice: {
      name: 'INV-4028.txt',
      type: 'invoice',
      mimeType: 'text/plain',
      fileSize: '1.0 KB',
      content: `--- INVOICE ---
Invoice Number: INV-4028
Invoice Date: 2026-05-18
Vendor: ComfortWorks Furniture Co.
PO Refer: PO-771144

BILL ITEMS:
1. Deluxe Ergonomic Mesh Chair (Black)
   Qty: 15 chairs
   Unit Price: $320.00
   Total Price: $4,800.00

Total Amount: $4,800.00
Shipment Carrier: SpeedyFreight`
    },
    po: {
      name: 'PO-771144.txt',
      type: 'po',
      mimeType: 'text/plain',
      fileSize: '1.0 KB',
      content: `--- PURCHASE ORDER ---
PO Number: PO-771144
PO Date: 2026-05-05
Vendor: ComfortWorks Furniture Co.

Line Items:
1. Deluxe Ergonomic Mesh Chair (Black)
   Qty: 15 chairs
   Unit Price: $280.00
   Total Price: $4,200.00

Payment Terms: Net 45 days.`
    },
    receipt: {
      name: 'GRN-33122-GoodsReceipt.txt',
      type: 'receipt',
      mimeType: 'text/plain',
      fileSize: '0.8 KB',
      content: `--- GOODS RECEIPT NOTE ---
Receipt Number: GRN-33122
Delivery Date: 2026-05-12
PO Reference: PO-771144

ITEMS ACCEPTED:
1. Deluxe Ergonomic Mesh Chair (Black)
   Qty Received: 15 chairs
   Accepted By: Thomas O\'Connor (Facilities)`
    },
    contract: {
      name: 'MSA-ComfortWorks-2026.txt',
      type: 'contract',
      mimeType: 'text/plain',
      fileSize: '1.5 KB',
      content: `--- VENDOR MASTER SUPPLY CONTRACT ---
Contract Reference: VMSC-ComfortWorks-2026
Effective Date: 2026-01-01

Section (Pricing Schedule):
Item Rate Sheets:
- Deluxe Ergonomic Mesh Chair: Standard rate of $280.00 per unit.
- Comfort Seat Cushion: Standard rate of $35.00 per unit.

Section VII.b:
Pricing is locked for the calendar year 2026. No unilateral surcharge or rate increases are permitted.`
    }
  },
  {
    id: 'packet-dated-conflict',
    title: 'Facility Maintenance - SOP Conflict Resolution',
    description: 'Demonstrates rule-based conflict resolution when there are two dated records, prioritizing the latest SOP and formal agreement.',
    invoice: {
      name: 'INV-902241.txt',
      type: 'invoice',
      mimeType: 'text/plain',
      fileSize: '1.1 KB',
      content: `--- INVOICE ---
Invoice Number: INV-902241
Invoice Date: 2026-05-10
Vendor: CleanPro Facilities Services
Bill To: Enterprise Corp Inc.

SERVICES BILLED:
1. Critical HVAC filter replacement & duct sweep (Full Site)
   Service Rendered Date: 2026-05-05
   Billed Rate: $1,800.00

Total Due: $1,800.00`
    },
    po: {
      name: 'PO-334455.txt',
      type: 'po',
      mimeType: 'text/plain',
      fileSize: '0.9 KB',
      content: `--- PURCHASE ORDER ---
PO Number: PO-334455
PO Date: 2026-04-20
Vendor: CleanPro Facilities Services

ITEMS APPROVED:
1. HVAC filter replacement & duct sweep
   Qty: 1 service
   Approved Rate: $1,500.00`
    },
    receipt: {
      name: 'SRN-5512-ServiceSignoff.txt',
      type: 'receipt',
      mimeType: 'text/plain',
      fileSize: '0.8 KB',
      content: `--- SERVICE SIGNOFF SHEET ---
Signoff Number: SRN-5512
Completion Date: 2026-05-06
Vendor: CleanPro Facilities Services

Services completed:
- HVAC filter replacement & duct sweep (Completed fully at Main HQ)
Sign-off by: Julia Gomez, HR & Facilities VP`
    },
    contract: {
      name: 'Service-Agreement-Amendment2.txt',
      type: 'contract',
      mimeType: 'text/plain',
      fileSize: '1.9 KB',
      content: `--- SERVICE AGREEMENT & AMENDMENTS ---
Vendor: CleanPro Facilities Services

SOP-Rate-Sheet-2025 (Dated 2025-05-01):
- Subsection (Rates v1): Full HVAC sweep flat rate is $1,500.00 per instance.

SOP-Rate-Sheet-2026-v2 (Dated 2026-03-15):
- Subsection (Rates Amendment): Full HVAC filter replacement and duct sweep flat rate is adjusted to $1,800.00 to account for specialized high-efficiency particulate air (HEPA) filter material requirements.

Section (Priority of Documentation):
If rate discrepancies arise, the latest approved Service Fee Amendment signed in writing takes absolute precedence.`
    }
  }
];
