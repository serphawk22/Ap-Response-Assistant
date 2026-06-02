import { P2PPacket } from './types';

export interface BatchItem {
  id: string;
  title: string;
  vendor: string;
  invoiceNo: string;
  poNo: string;
  receiptNo: string;
  contractNo: string;
  status: 'Matched' | 'Price Variance' | 'Quantity Discrepancy' | 'Date Warning' | 'Pending PO';
  invoiceAmount: number;
  poAmount: number;
  balanceContractValue: number;
  invoiceQty: number;
  receiptQty: number;
  date: string;
  description: string;
}

// Generate exactly 80 diverse AP records
export function generate80Records(): BatchItem[] {
  const vendors = [
    'Apex Systems Inc.', 
    'ComfortWorks Furniture Co.', 
    'CleanPro Facilities Services', 
    'Global Tech Corp',
    'Zeta Power Solutions',
    'Vertex Industrial Supp.',
    'Horizon Software Labs',
    'Alpha Consulting Group'
  ];

  const statuses: ('Matched' | 'Price Variance' | 'Quantity Discrepancy' | 'Date Warning' | 'Pending PO')[] = [
    'Matched', 'Matched', 'Price Variance', 'Quantity Discrepancy', 'Date Warning',
    'Matched', 'Pending PO', 'Price Variance', 'Matched', 'Quantity Discrepancy'
  ];

  const items: BatchItem[] = [];

  for (let i = 1; i <= 80; i++) {
    const vendorIndex = (i - 1) % vendors.length;
    const vendor = vendors[vendorIndex];
    
    // Choose status based on index to distribute them predictably
    const statusIdx = (i * 3 + 2) % statuses.length;
    const status = statuses[statusIdx];

    // Generate price and quantities
    const baseUnitPrice = 100 + (i % 7) * 45;
    const poQty = 5 + (i % 12) * 5;
    const invoiceQty = (status === 'Quantity Discrepancy') ? poQty + 5 : poQty;
    const receiptQty = (status === 'Quantity Discrepancy') ? poQty - 3 : poQty;

    const poAmt = baseUnitPrice * poQty;
    const invoiceAmt = (status === 'Price Variance') ? (baseUnitPrice + 35) * invoiceQty : baseUnitPrice * invoiceQty;

    // Dates
    const prevDays = 120 - i;
    const baseDate = new Date(2026, 4, 21); // May 21, 2026
    baseDate.setDate(baseDate.getDate() - prevDays);
    const dateStr = baseDate.toISOString().split('T')[0];

    const description = `Procurement order for ${vendor} comprising service tier level ${i % 3 + 1} and auxiliary parts.`;

    items.push({
      id: `P2P-2026-B${String(i).padStart(3, '0')}`,
      title: `${vendor.split(' ')[0]} Transaction #${1000 + i}`,
      vendor,
      invoiceNo: `INV-2026-${5000 + i}`,
      poNo: `PO-9900-${7000 + i}`,
      receiptNo: `GRN-8800-${4000 + i}`,
      contractNo: `MSA-2025-${i % 4 + 10}`,
      status,
      invoiceAmount: status === 'Pending PO' ? 0 : invoiceAmt,
      poAmount: poAmt,
      balanceContractValue: Math.max(12000, 150000 - (i * 1750)),
      invoiceQty: status === 'Pending PO' ? 0 : invoiceQty,
      receiptQty,
      date: dateStr,
      description
    });
  }

  return items;
}

// Convert batch item back to beautiful fully populated P2PPacket representation
export function convertToP2P(item: BatchItem): P2PPacket {
  const cleanVendor = item.vendor;
  const isPending = item.status === 'Pending PO';

  return {
    id: item.id,
    title: `${item.title} (${item.status})`,
    description: `Automated dynamic packet loaded from Batch Ledger #${item.id}. Status reports: ${item.status}. Details: ${item.description}`,
    invoice: isPending ? null : {
      name: `${item.invoiceNo}.txt`,
      type: 'invoice',
      mimeType: 'text/plain',
      fileSize: '1.1 KB',
      content: `--- VENDOR INVOICE ---
Invoice Number: ${item.invoiceNo}
Invoice Date: ${item.date}
Vendor: ${cleanVendor}
Bill To: Enterprise Corp Inc.
Purchase Order Reference: ${item.poNo}

LINE ITEMS:
1. Standard Product Tier Allocation
   Qty: ${item.invoiceQty} units
   Unit Price: $${(item.invoiceAmount / item.invoiceQty).toFixed(2)}
   Total Price: $${item.invoiceAmount.toLocaleString()}

Total Due: $${item.invoiceAmount.toLocaleString()}
Payment Terms: Net 30, subject to vendor contract.`
    },
    po: {
      name: `${item.poNo}.txt`,
      type: 'po',
      mimeType: 'text/plain',
      fileSize: '1.0 KB',
      content: `--- PURCHASE ORDER ---
PO Number: ${item.poNo}
PO Date: ${item.date}
Vendor: ${cleanVendor}
Buyer: Enterprise Corp Inc.

LINE ITEMS:
1. Standard Product Tier Allocation
   Qty: ${item.invoiceQty === 0 ? item.receiptQty : item.invoiceQty} units
   Unit Price: $${(item.poAmount / (item.invoiceQty === 0 ? item.receiptQty : item.invoiceQty)).toFixed(2)}
   Total Price: $${item.poAmount.toLocaleString()}

Authorized Signature: Purchasing Lead`
    },
    receipt: {
      name: `${item.receiptNo}.txt`,
      type: 'receipt',
      mimeType: 'text/plain',
      fileSize: '0.9 KB',
      content: `--- GOODS RECEIPT NOTE ---
Receipt Number: ${item.receiptNo}
Receipt Date: ${item.date}
Received By: Logistics Supervisor
PO Reference: ${item.poNo}

ITEMS RECEIVED:
1. Standard Product Tier Allocation
   Qty Delivered: ${item.receiptQty} units
   Condition: Quality verified, undamaged packing list matches.

Status: Logistics receipt signed.`
    },
    contract: {
      name: `${item.contractNo}.txt`,
      type: 'contract',
      mimeType: 'text/plain',
      fileSize: '1.8 KB',
      content: `--- MASTER SERVICES AGREEMENT ---
Contract ID: ${item.contractNo}
Effective Date: 2025-01-15
Parties: Enterprise Corp Inc. & ${cleanVendor}

Section (Pricing Schedule):
Pricing rules governing volume purchases in fiscal year 2026:
- Standard Product Tier Allocation: Guaranteed unit price locked at $${(item.poAmount / (item.invoiceQty === 0 ? item.receiptQty : item.invoiceQty)).toFixed(2)} per unit.

Section (Disputes & Surcharges):
Pricing conflicts between Purchase Orders and Invoice bills shall default to this master schedule. Payments must occur within Net 30.`
    }
  };
}
