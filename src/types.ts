export interface DocumentFile {
  name: string;
  type: 'invoice' | 'po' | 'receipt' | 'contract';
  content: string; // Text content or base64 data
  mimeType: string; // e.g. 'text/plain', 'image/png', 'application/pdf'
  fileSize?: string;
}

export interface P2PPacket {
  id: string;
  title: string;
  description: string;
  invoice: DocumentFile | null;
  po: DocumentFile | null;
  receipt: DocumentFile | null;
  contract: DocumentFile | null;
}

export interface MatchResult {
  conclusion: string;
  evidence: string;
  policyBasis: string;
  nextSteps: string;
  rawText?: string;
  extractedFields?: {
    vendorMatched: boolean;
    priceMatched: boolean;
    quantityMatched: boolean;
    dateMatched: boolean;
    details: {
      invoice: Record<string, string>;
      po: Record<string, string>;
      receipt: Record<string, string>;
      contract: Record<string, string>;
    };
  };
}

export interface VendorMasterItem {
  id: string;
  name: string;
  contractNo: string;
  contractValue: number;
  lockedPricePerUnit: number;
  paymentTerms: string;
  status: 'Active' | 'Under Audit' | 'Suspended';
  contactName: string;
  contactEmail: string;
  address: string;
  totalOrders: number;
}

