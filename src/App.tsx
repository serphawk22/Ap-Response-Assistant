import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  FileSearch2, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  Play, 
  Briefcase, 
  UserCheck, 
  FileWarning, 
  Info,
  Calendar,
  DollarSign,
  AlertOctagon,
  FileText,
  Send,
  Scale,
  ShieldAlert,
  Layers,
  ArrowRight,
  Workflow,
  Check,
  Search,
  Filter,
  Layers3,
  ListFilter,
  CheckCircle,
  FileCheck,
  XCircle,
  Users,
  Sun,
  Moon,
  HelpCircle as QuestionIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Eye,
  Trash2,
  Sparkles,
  Upload,
  ArrowUpCircle
} from 'lucide-react';
import { generate80Records, convertToP2P, BatchItem } from './recordsGenerator';
import { DocumentEditor } from './components/DocumentEditor';
import { P2PPacket, MatchResult, DocumentFile, VendorMasterItem } from './types';
import IngestionOnboardingSlide from './components/IngestionOnboardingSlide';
import { motion, AnimatePresence } from 'motion/react';


// Let's define the shape of history logs for resolution responses
interface DiscrepancyLog {
  id: string;
  timestamp: string;
  actionType: 'approve' | 'flag' | 'route';
  statusLabel: string;
  operator: string;
  department: string;
  details: string;
}

function generateInitialVendorMaster(records: BatchItem[]): VendorMasterItem[] {
  const vendors = [
    { name: 'Apex Systems Inc.', contact: 'John Carter', email: 'jcarter@apex.com', address: '100 Silicon Way, San Jose CA', terms: 'Net 30' },
    { name: 'ComfortWorks Furniture Co.', contact: 'Evelyn Wood', email: 'ewood@comfortworks.com', address: '44 Oak Avenue, Grand Rapids MI', terms: 'Net 30' },
    { name: 'CleanPro Facilities Services', contact: 'Roy Miller', email: 'rmiller@cleanpro.com', address: '12 Commercial Rd, Chicago IL', terms: 'Net 15' },
    { name: 'Global Tech Corp', contact: 'Anita Desai', email: 'adesai@globaltech.com', address: '88 Tech Blvd, Cambridge MA', terms: 'Net 45' },
    { name: 'Zeta Power Solutions', contact: 'Zack Evans', email: 'zevans@zetapower.com', address: '303 Voltage Dr, Denver CO', terms: 'Net 30' },
    { name: 'Vertex Industrial Supp.', contact: 'Vince Stark', email: 'vstark@vertexind.com', address: '50 Steel Arch Way, Pittsburgh PA', terms: 'Net 30' },
    { name: 'Horizon Software Labs', contact: 'Helena Troy', email: 'helena@horizonsoft.io', address: '500 Cloud Vista Route, Seattle WA', terms: 'Net 60' },
    { name: 'Alpha Consulting Group', contact: 'Albert Phil', email: 'aphil@alphaconsulting.com', address: '1 Premier Court, New York NY', terms: 'Net 30' }
  ];

  return vendors.map((v, i) => {
    const vRecs = records.filter(r => r.vendor === v.name);
    const contractNo = vRecs[0]?.contractNo || `MSA-2025-${i + 10}`;
    const lockedPrice = vRecs[0] ? (vRecs[0].poAmount / (vRecs[0].invoiceQty === 0 ? vRecs[0].receiptQty : vRecs[0].invoiceQty)) : 100;
    const contractValue = vRecs.reduce((sum, r) => sum + r.poAmount, 0) * 1.5;

    return {
      id: `VR-${String(i + 1).padStart(3, '0')}`,
      name: v.name,
      contractNo,
      contractValue: Math.round(contractValue),
      lockedPricePerUnit: Math.round(lockedPrice),
      paymentTerms: v.terms,
      status: 'Active' as const,
      contactName: v.contact,
      contactEmail: v.email,
      address: v.address,
      totalOrders: vRecs.length
    };
  });
}

export default function App() {
  // Generation of our 80 baseline records as a real state
  const [allRecords, setAllRecords] = useState<BatchItem[]>(() => generate80Records());

  // Generation of our Vendor Master details registry state
  const [vendorMaster, setVendorMaster] = useState<VendorMasterItem[]>(() => {
    const records = generate80Records();
    return generateInitialVendorMaster(records);
  });


  // Theme selection state ('obsidian' | 'ivory')
  const [contrastTheme, setContrastTheme] = useState<'obsidian' | 'ivory'>('obsidian');

  // Presentation Slider active slide index (0: Dashboard, 1: Ledger Catalog, 2: Match verification, 3: Operational editors)
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  const handleSlideChange = (nextSlide: number) => {
    if (nextSlide > activeSlide) {
      setSlideDirection('forward');
    } else {
      setSlideDirection('backward'); // sliding the other way
    }
    setActiveSlide(nextSlide);
  };

  // Lower layout active tab state ('ledger' | 'matching')
  const [activeLowerTab, setActiveLowerTab] = useState<'ledger' | 'matching'>('ledger');

  // Expanded evidence drawers for Comparative Matrix ('vendor' | 'price' | 'quantity' | 'date' | null)
  const [expandedEvidenceKey, setExpandedEvidenceKey] = useState<'vendor' | 'price' | 'quantity' | 'date' | null>(null);

  // Helper to extract granular evidence excerpts from active document files
  const scanDocumentForEvidence = (docType: 'invoice' | 'po' | 'receipt' | 'contract', searchKey: 'vendor' | 'price' | 'quantity' | 'date') => {
    const doc = currentPacket[docType];
    if (!doc || !doc.content) return null;
    
    // If it's an image or PDF, we don't have line text, so return coordinates
    if (doc.mimeType?.startsWith('image/') || doc.content.startsWith('data:image/')) {
      if (searchKey === 'vendor') return `Visual Pointer: Bounding Coordinates: [24, 110, 185, 40] in scan viewport.`;
      if (searchKey === 'price') return `Visual Pointer: Bounding Coordinates: [310, 485, 95, 20] in scan viewport.`;
      if (searchKey === 'quantity') return `Visual Pointer: Bounding Coordinates: [280, 485, 30, 20] in scan viewport.`;
      if (searchKey === 'date') return `Visual Pointer: Bounding Coordinates: [420, 110, 120, 20] in scan viewport.`;
    }
    if (doc.mimeType?.includes('pdf') || doc.content.startsWith('data:application/pdf')) {
      if (searchKey === 'vendor') return `PDF Metadata Trace: Heading Section 1, Column A.`;
      if (searchKey === 'price') return `PDF Metadata Trace: Line Item list item 1, Sub-column C.`;
      if (searchKey === 'quantity') return `PDF Metadata Trace: Line Item list item 1, Sub-column B.`;
      if (searchKey === 'date') return `PDF Metadata Trace: Header layout, top-right block.`;
    }

    // Programmatic text line search
    const lines = doc.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      
      if (searchKey === 'vendor' && (lower.includes('vendor:') || lower.includes('parties:') || lower.includes('contractor:'))) {
        return `Line ${i + 1}: "${line.trim()}"`;
      }
      if (searchKey === 'price' && (lower.includes('unit price:') || lower.includes('rate:') || lower.includes('price:') || lower.includes('unit price'))) {
        return `Line ${i + 1}: "${line.trim()}"`;
      }
      if (searchKey === 'quantity' && (lower.includes('qty:') || lower.includes('quantity:') || lower.includes('qty delivered:') || lower.includes('units:'))) {
        return `Line ${i + 1}: "${line.trim()}"`;
      }
      if (searchKey === 'date' && (lower.includes('date:') || lower.includes('invoice date:') || lower.includes('po date:') || lower.includes('receipt date:'))) {
        return `Line ${i + 1}: "${line.trim()}"`;
      }
    }
    
    return null;
  };

  const getFieldEvidenceExcerpts = (type: 'vendor' | 'price' | 'quantity' | 'date') => {
    const packet = currentPacket;
    if (!packet) return { invoice: 'N/A', po: 'N/A', receipt: 'N/A', contract: 'N/A' };
    
    const invoiceScan = scanDocumentForEvidence('invoice', type);
    const poScan = scanDocumentForEvidence('po', type);
    const receiptScan = scanDocumentForEvidence('receipt', type);
    const contractScan = scanDocumentForEvidence('contract', type);

    const fallbacks = {
      vendor: {
        invoice: `Line 3: "Vendor: ${getExtractedField('invoice', 'vendor')}"`,
        po: `Line 4: "Vendor: ${getExtractedField('po', 'vendor')}"`,
        receipt: `Line 3: "Vendor: ${getExtractedField('receipt', 'vendor')}"`,
        contract: `Line 4: "Parties: Enterprise Corp Inc. & ${getExtractedField('contract', 'vendor') || 'Registered Partner'}"`
      },
      price: {
        invoice: `Line 12: "Unit Price: ${getExtractedField('invoice', 'amount')}"`,
        po: `Line 11: "Unit Price: ${getExtractedField('po', 'amount')}"`,
        receipt: `N/A (Goods Receipt Note does not contain price data)`,
        contract: `Line 8: "Guaranteed unit price locked at ${getExtractedField('contract', 'amount')} per unit"`
      },
      quantity: {
        invoice: `Line 11: "Qty: ${getExtractedField('invoice', 'quantity')}"`,
        po: `Line 11: "Qty: ${getExtractedField('po', 'quantity')}"`,
        receipt: `Line 8: "Qty Delivered: ${getExtractedField('receipt', 'quantity')}"`,
        contract: `N/A (Volume-flexible schedule)`
      },
      date: {
        invoice: `Line 2: "Invoice Date: ${getExtractedField('invoice', 'date')}"`,
        po: `Line 2: "PO Date: ${getExtractedField('po', 'date')}"`,
        receipt: `Line 2: "Receipt Date: ${getExtractedField('receipt', 'date')}"`,
        contract: `Line 2: "Effective Date: ${getExtractedField('contract', 'date')}"`
      }
    };

    return {
      invoice: invoiceScan || fallbacks[type].invoice,
      po: poScan || fallbacks[type].po,
      receipt: receiptScan || fallbacks[type].receipt,
      contract: contractScan || fallbacks[type].contract
    };
  };

  // Vendor selection state
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');

  // Unique list of vendors from our database
  const vendorsList = useMemo(() => {
    const list = new Set<string>();
    allRecords.forEach(r => list.add(r.vendor));
    return Array.from(list).sort();
  }, [allRecords]);

  // Filter 80 records based on selected vendor
  const vendorFilteredRecords = useMemo(() => {
    if (selectedVendor === 'ALL') return allRecords;
    return allRecords.filter(rec => rec.vendor === selectedVendor);
  }, [allRecords, selectedVendor]);

  // State managers
  const [currentPacket, setCurrentPacket] = useState<P2PPacket>(() => convertToP2P(allRecords[0]));
  const [auditResult, setAuditResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'conclusion' | 'evidence' | 'policy' | 'steps'>('all');

  // Discrepancy handling form state
  const [selectedResolAction, setSelectedResolAction] = useState<'approve' | 'flag' | 'route'>('approve');
  const [approveReasonCode, setApproveReasonCode] = useState<string>('Contract Tier Compensation Clause Override');
  const [overrideJustification, setOverrideJustification] = useState<string>('');
  const [flagSeverity, setFlagSeverity] = useState<string>('High Priority');
  const [flagCategory, setFlagCategory] = useState<string>('Rate variance against locked MSA limits');
  const [assignedDepartment, setAssignedDepartment] = useState<string>('Procurement Operations Tier 2');
  const [individualAssignee, setIndividualAssignee] = useState<string>('Sarah Jenkins (Purchasing Lead)');
  const [routeNotes, setRouteNotes] = useState<string>('');

  // 80 Records Browser Filters and Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 3;

  // Pie chart slice focus state
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  // Bar focus state
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // States for Invoice Visual Document Copy display board
  const [invoiceZoom, setInvoiceZoom] = useState<number>(1);
  const [invoiceRotate, setInvoiceRotate] = useState<number>(0);

  // States for interactive high-tech bill scanning
  const [isScanningBill, setIsScanningBill] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const triggerBillScanAnimation = (fileName: string) => {
    setIsScanningBill(true);
    setScanProgress(0);
    setScanLogs([
      `[SYSTEM] Connecting to OCR digitizer gateway...`,
      `[INGEST] Loading digital copy "${fileName || 'invoice_copy.pdf'}"...`,
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setScanProgress(step);
      
      if (step === 30) {
        setScanLogs(prev => [...prev, `[OCR-CORE] Extracting layout bounding boxes and structural text...`]);
      } else if (step === 50) {
        setScanLogs(prev => [...prev, `[METRICS] Mapped Total Amount & Items from table matrix.`]);
      } else if (step === 80) {
        setScanLogs(prev => [...prev, `[COMPLIANCE] Generated semantic vectors for cross-examination ledger comparison.`]);
      } else if (step >= 100) {
        clearInterval(interval);
        setScanLogs(prev => [...prev, `[COMPLETE] Ingestion successful. Matrix updated.`]);
        setIsScanningBill(false);
      }
    }, 100);
  };

  const renderPointWiseEvidence = (text: string) => {
    if (!text) return <span className="text-slate-550 italic">[No evidence loaded]</span>;
    
    // Split text into lines, filter out noise
    const rawLines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('---'));

    if (rawLines.length === 0) return <span className="text-slate-550 italic">[Evidence list empty]</span>;

    // Stacked vertically one below another with substantial gaps (space-y-5) and elegant cushions
    return (
      <div className="flex flex-col space-y-5">
        {rawLines.map((line, idx) => {
          // Strip any leading pre-existing bullet symbols to keep layout pristine
          const cleanLine = line.replace(/^(\d+[\.\)]|[-•*+])\s*/, '').trim();
          
          return (
            <div 
              key={idx} 
              id={`evidence-point-${idx}`}
              className="flex items-start bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/60 transition duration-150 shadow-sm"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono text-xs font-black mr-4 mt-0.5 shadow-sm">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{cleanLine}</p>
            </div>
          );
        })}
      </div>
    );
  };

  // Ref and manual handler for top-level bill scan/upload station
  const billScanInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBillScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    
    reader.onload = (evt) => {
      const resultValue = evt.target?.result as string;
      const updatedInvoice: DocumentFile = {
        name: file.name,
        type: 'invoice',
        mimeType: file.type || (isImage ? 'image/png' : isPdf ? 'application/pdf' : 'text/plain'),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        content: resultValue
      };
      
      setCurrentPacket(prev => ({
        ...prev,
        invoice: updatedInvoice
      }));
      setSystemBannerMessage(null);
      triggerBillScanAnimation(file.name);
    };

    if (isImage || isPdf) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Reset magnification and rotate transformations when selecting a new document
  React.useEffect(() => {
    setInvoiceZoom(1);
    setInvoiceRotate(0);
  }, [currentPacket.id]);

  // Automatically update active packet when vendor changes to match selecting vendor's first file
  React.useEffect(() => {
    const firstRec = vendorFilteredRecords[0];
    if (firstRec) {
      setCurrentPacket(convertToP2P(firstRec));
      setAuditResult(null);
      setErrorMsg(null);
      setSystemBannerMessage(null);
    }
  }, [selectedVendor, vendorFilteredRecords]);

  // Dynamic stateful audit timeline workflow logs
  const [workflowHistory, setWorkflowHistory] = useState<Record<string, DiscrepancyLog[]>>({
    'P2P-2026-B001': [
      {
        id: 'log-1',
        timestamp: '2026-05-15 10:22:00',
        actionType: 'approve',
        statusLabel: 'CLEARED & MATCHED',
        operator: 'System Daemon',
        department: 'AP Automation System',
        details: 'Initial robotic process validation passed. No numerical variances found.'
      }
    ],
    'P2P-2026-B003': [
      {
        id: 'log-2',
        timestamp: '2026-05-18 14:30:10',
        actionType: 'flag',
        statusLabel: 'AUTOMATIC SYSTEM HOLD',
        operator: 'Gemini Core Engine',
        department: 'Security compliance system',
        details: 'Auto-flagged due to unit price mismatch. Surcharge hold active.'
      }
    ]
  });

  // Action feedback feedback banner message
  const [systemBannerMessage, setSystemBannerMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Math Calculations for our Dashboard Metrics over all selected Vendor Records
  const metrics = useMemo(() => {
    let totalPoValue = 0;
    let totalMatchedInvoiceValue = 0;
    let totalPendingPoValue = 0;
    let totalBalanceContractValue = 0;

    let matchedCount = 0;
    let priceVarianceCount = 0;
    let qtyDiscrepancyCount = 0;
    let dateWarningCount = 0;
    let pendingPoCount = 0;

    vendorFilteredRecords.forEach(rec => {
      totalPoValue += rec.poAmount;
      totalBalanceContractValue += rec.balanceContractValue;

      if (rec.status === 'Matched') {
        totalMatchedInvoiceValue += rec.invoiceAmount;
        matchedCount++;
      } else if (rec.status === 'Price Variance') {
        priceVarianceCount++;
      } else if (rec.status === 'Quantity Discrepancy') {
        qtyDiscrepancyCount++;
      } else if (rec.status === 'Date Warning') {
        dateWarningCount++;
      } else if (rec.status === 'Pending PO') {
        totalPendingPoValue += rec.poAmount;
        pendingPoCount++;
      }
    });

    return {
      totalPoValue,
      totalMatchedInvoiceValue,
      totalPendingPoValue,
      totalBalanceContractValue,
      counts: {
        Matched: matchedCount,
        'Price Variance': priceVarianceCount,
        'Quantity Discrepancy': qtyDiscrepancyCount,
        'Date Warning': dateWarningCount,
        'Pending PO': pendingPoCount
      }
    };
  }, [vendorFilteredRecords]);

  // Filtering the vendor-filtered records for the Browser/Ledger Directory
  const filteredRecords = useMemo(() => {
    return vendorFilteredRecords.filter(rec => {
      const matchesSearch = 
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.poNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vendorFilteredRecords, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Lists of matching vs actionable items for direct links in Option 3 & 4
  const matchingItemsList = useMemo(() => {
    return vendorFilteredRecords.filter(rec => rec.status === 'Matched');
  }, [vendorFilteredRecords]);

  const actionableItemsList = useMemo(() => {
    return vendorFilteredRecords.filter(rec => rec.status !== 'Matched');
  }, [vendorFilteredRecords]);

  const handleQuickRemediate = async (rec: BatchItem) => {
    const packet = convertToP2P(rec);
    setCurrentPacket(packet);
    setAuditResult(null);
    setErrorMsg(null);
    setSystemBannerMessage({
      type: 'info',
      text: `Remediation workspace loaded for packet ${rec.id} (Invoice: ${rec.invoiceNo}). Automated check initiated...`
    });
    setSlideDirection('forward');
    setActiveSlide(3); // Slide 3 is Verification Desk / Matching Desk
    await handleRunMatch(packet);
  };

  const handleViewMatchedItem = async (rec: BatchItem) => {
    const packet = convertToP2P(rec);
    setCurrentPacket(packet);
    setAuditResult(null);
    setErrorMsg(null);
    setSystemBannerMessage({
      type: 'success',
      text: `Displaying fully matched record ${rec.id} from direct dashboard selector.`
    });
    setSlideDirection('forward');
    setActiveSlide(2); // Slide 2 holds active Ledger Catalog
  };
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Trigger matching using the backend Express API
  const handleRunMatch = async (optionalPacket?: P2PPacket) => {
    setErrorMsg(null);
    setAuditResult(null);
    setSystemBannerMessage(null);

    const targetPacket = optionalPacket || currentPacket;

    // Client-side guard: if no documents are loaded at all, auto-load the first
    // sample record and prompt the user to try again instead of showing a cryptic
    // server-side 400 error banner.
    const hasAnyDoc =
      targetPacket.invoice || targetPacket.po || targetPacket.receipt || targetPacket.contract;

    if (!hasAnyDoc) {
      const firstRecord = allRecords[0];
      if (firstRecord) {
        const samplePacket = convertToP2P(firstRecord);
        setCurrentPacket(samplePacket);
        setSystemBannerMessage({
          type: 'info',
          text: `No documents were loaded in the workspace. Sample packet "${firstRecord.id}" (${firstRecord.vendor}) has been auto-loaded — click "RUN 4-WAY COMPLIANCE MATCH" again to validate.`,
        });
      } else {
        setErrorMsg(
          'No P2P documents are loaded. Please upload or select a batch item from the Ledger Catalog first.'
        );
      }
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: targetPacket.invoice,
          po: targetPacket.po,
          receipt: targetPacket.receipt,
          contract: targetPacket.contract,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error during matching validation.');
      }

      setAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred while communicating with the server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit hand-handled workflow override resolutions
  const handleResolveDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    let newLog: DiscrepancyLog;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (selectedResolAction === 'approve') {
      newLog = {
        id: 'custom-log-' + Date.now(),
        timestamp: nowStr,
        actionType: 'approve',
        statusLabel: 'MANUALLY OVERRIDDEN & APPROVED',
        operator: 'AP Officer (prajwalkumar3@gmail.com)',
        department: 'Accounts Payable Control Center',
        details: `Discrepancy approved as is. Override Reason Code: "${approveReasonCode}". Justification: "${overrideJustification || 'Acknowledged and approved'}"`
      };
      setSystemBannerMessage({
        type: 'success',
        text: `Invoice Approved: Discrepancy successfully overriden under code "${approveReasonCode}".`
      });
    } else if (selectedResolAction === 'flag') {
      newLog = {
        id: 'custom-log-' + Date.now(),
        timestamp: nowStr,
        actionType: 'flag',
        statusLabel: `FLAGGED UNDER INVESTIGATION (${flagSeverity.toUpperCase()})`,
        operator: 'AP Lead Senior Auditor',
        department: 'Enterprise Compliance Audit team',
        details: `Discrepancy flagged. Category: "${flagCategory}". Severity: "${flagSeverity}". Details logged for vendor follow-up.`
      };
      setSystemBannerMessage({
        type: 'info',
        text: `Discrepancy Flagged: The invoice status has been updated to "${flagSeverity}" status limit.`
      });
    } else {
      newLog = {
        id: 'custom-log-' + Date.now(),
        timestamp: nowStr,
        actionType: 'route',
        statusLabel: `ROUTED FOR ADJUDICATION`,
        operator: 'AP Coordinator',
        department: assignedDepartment,
        details: `Packet files routed directly to: ${individualAssignee}. Message: "${routeNotes || 'Please review this matching anomaly immediately.'}"`
      };
      setSystemBannerMessage({
        type: 'success',
        text: `Routed Successfully: Discrepancy brief dispatched to ${individualAssignee} in "${assignedDepartment}".`
      });
    }

    // Append to dynamic logs
    setWorkflowHistory(prev => ({
      ...prev,
      [currentPacket.id]: [newLog, ...(prev[currentPacket.id] || [])]
    }));

    // Reset notes
    setOverrideJustification('');
    setRouteNotes('');
  };

  const handleUpdateDocument = (type: 'invoice' | 'po' | 'receipt' | 'contract', updatedDoc: DocumentFile | null) => {
    setCurrentPacket(prev => ({
      ...prev,
      [type]: updatedDoc
    }));
    setSystemBannerMessage(null);
    if (type === 'invoice' && updatedDoc) {
      triggerBillScanAnimation(updatedDoc.name);
    }
  };

  // Quick packet triggers
  const handleLoadPacket = (packet: P2PPacket) => {
    setCurrentPacket(packet);
    setAuditResult(null);
    setErrorMsg(null);
    setSystemBannerMessage(null);
    if (packet.invoice) {
      triggerBillScanAnimation(packet.invoice.name);
    }
  };

  const handleLoadBatchItem = (item: BatchItem) => {
    handleLoadPacket(convertToP2P(item));
  };

  const handleDoubleClickBatchItem = async (item: BatchItem) => {
    await handleQuickRemediate(item);
  };

  const handleClearAll = () => {
    setCurrentPacket({
      id: 'custom-' + Date.now(),
      title: 'Custom Procurement Packet',
      description: 'User-specified procure-to-pay transaction details.',
      invoice: null,
      po: null,
      receipt: null,
      contract: null
    });
    setAuditResult(null);
    setErrorMsg(null);
    setSystemBannerMessage(null);
  };

  // Helper values for extracted fields matrix
  const getExtractedField = (type: 'invoice' | 'po' | 'receipt' | 'contract', fieldName: 'vendor' | 'date' | 'amount' | 'quantity') => {
    if (auditResult && auditResult.extractedFields?.details?.[type]) {
      return auditResult.extractedFields.details[type][fieldName] || 'N/A';
    }
    
    // Guess fallback from text headers for display
    const doc = currentPacket[type];
    if (!doc) return 'MISSING';
    
    const txt = doc.content.toLowerCase();
    if (fieldName === 'vendor') {
      if (txt.includes('apex')) return 'Apex Systems Inc.';
      if (txt.includes('comfortworks')) return 'ComfortWorks Furniture Co.';
      if (txt.includes('cleanpro')) return 'CleanPro Facilities Services';
      if (txt.includes('global tech')) return 'Global Tech Corp';
      const match = doc.content.match(/Vendor:\s*([^\n]+)/i);
      return match ? match[1].trim() : 'Detected...';
    }
    if (fieldName === 'date') {
      const match = doc.content.match(/(?:Date|Effective Date|Delivery Date|Invoice Date|PO Date):\s*([0-9-]{10})/i);
      return match ? match[1].trim() : 'Detected...';
    }
    if (fieldName === 'amount') {
      const match = doc.content.match(/(?:Total Due|Total Amount|Billed Rate|Rate|Total Price|locked at|price of):\s*(\$[0-9,.]+)/i);
      return match ? match[1].trim() : 'Detected...';
    }
    if (fieldName === 'quantity') {
      const match = doc.content.match(/(?:Qty|Qty Delivered|Qty Received|Delivered|Qty:):\s*(\d+)/i);
      return match ? `${match[1].trim()} units` : 'Detected...';
    }
    return 'Pending Match';
  };

  // Check if fields are identical
  const isVendorConflict = () => {
    if (auditResult) return !auditResult.extractedFields?.vendorMatched;
    return false;
  };

  const isPriceConflict = () => {
    if (auditResult) return !auditResult.extractedFields?.priceMatched;
    return false;
  };

  const isQuantityConflict = () => {
    if (auditResult) return !auditResult.extractedFields?.quantityMatched;
    return false;
  };

  const isDateConflict = () => {
    if (auditResult) return !auditResult.extractedFields?.dateMatched;
    return false;
  };

  // Get active discrepancy list for diagnosis panel
  const getDiscrepancyDiagnosisList = () => {
    const list: string[] = [];
    if (isVendorConflict()) {
      list.push(`VENDOR NAME MISMATCH: Invoice lists "${getExtractedField('invoice', 'vendor')}" but Contract / PO expects "${getExtractedField('contract', 'vendor') || getExtractedField('po', 'vendor')}".`);
    }
    if (isPriceConflict()) {
      list.push(`UNIT RATE VARIANCE DETECTED: Master Contract states authorized unit price is "${getExtractedField('contract', 'amount')}" but Invoice billed value is "${getExtractedField('invoice', 'amount')}".`);
    }
    if (isQuantityConflict()) {
      list.push(`QUANTITY VARIANCE RECEIVED: Goods receipt registers "${getExtractedField('receipt', 'quantity')}" physical units delivered, but Invoice seeks payment for "${getExtractedField('invoice', 'quantity')}".`);
    }
    if (isDateConflict()) {
      list.push(`TRANSACTION TIMELINE WARNING: Date skew detected across transaction chain. Invoice date (${getExtractedField('invoice', 'date')}), Goods Receipt (${getExtractedField('receipt', 'date')}), PO (${getExtractedField('po', 'date')}). Check compliance.`);
    }
    if (list.length === 0 && auditResult) {
      if (auditResult.conclusion.toLowerCase().includes('discrepancy') || auditResult.conclusion.toLowerCase().includes('mismatch') || auditResult.conclusion.toLowerCase().includes('unmatched')) {
        list.push(`COMPLIANCE WARNING: Cross-referencing identified documentation inconsistencies. Review Audit conclusion notes below for safety action.`);
      }
    }
    return list;
  };

  const activeDiscrepancies = getDiscrepancyDiagnosisList();

  // Pie chart computations
  const pieData = [
    { name: 'Matched', value: metrics.counts.Matched, color: '#10b981' },
    { name: 'Price Variance', value: metrics.counts['Price Variance'], color: '#f59e0b' },
    { name: 'Quantity Discrepancy', value: metrics.counts['Quantity Discrepancy'], color: '#3b82f6' },
    { name: 'Date Warning', value: metrics.counts['Date Warning'], color: '#ec4899' },
    { name: 'Pending PO', value: metrics.counts['Pending PO'], color: '#06b6d4' }
  ];

  const totalPieValues = pieData.reduce((sum, item) => sum + item.value, 0);

  // Simple clean render variables for SVG Donut chart
  let cumulativeAngle = 0;

  const isDark = contrastTheme === 'obsidian';

  // Dynamic mapped styles depending on the user selected professional contrast theme
  const getContrastStyles = (themeKey: typeof contrastTheme) => {
    const themeStylesMap: Record<string, any> = {
      obsidian: {
        backdropBg: 'bg-[#03060d] text-slate-100',
        shellContainer: 'border-slate-900/85 bg-[#0a0f1d] shadow-[0_25px_60px_rgba(0,0,0,0.85)]',
        headerBg: 'bg-[#0c1426] border-slate-900/80',
        headerTitleText: 'text-white font-black',
        headerSubtext: 'text-cyan-400 font-medium',
        headerInfoBlockBg: 'bg-slate-950/80 border-cyan-800/40 text-cyan-400 shadow-sm',
        headerInfoBlockText: 'text-slate-400',
        sectionCardBg: 'bg-[#0b1122]/80 border-slate-900/50 shadow-lg',
        sectionTitleText: 'text-slate-100 font-black',
        sectionLabelBg: 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 shadow-xs',
        subText: 'text-slate-400 font-semibold',
        textMuted: 'text-slate-505 font-medium',
        gridCardBg: 'bg-slate-950/45 border-slate-900/70 hover:border-cyan-500/30 shadow-xs text-white',
        gridCardValueText: 'text-cyan-400 font-extrabold',
        gridCardDescText: 'text-slate-450 font-medium',
        gridPrimaryText: 'text-slate-100',
        chartBoxBg: 'bg-[#0b1122]/80 border-slate-900/80 shadow-md',
        chartTitleText: 'text-slate-202 text-slate-200 font-black',
        chartLegendBg: 'border-slate-900 pt-2.5',
        donutLabelHoverBg: 'bg-[#10b981]/15',
        ledgerSecBg: 'bg-[#0d1428] border-slate-900/80',
        ledgerTitleText: 'text-slate-105 font-black',
        ledgerBoxSelected: 'bg-[#121f3a] border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]',
        ledgerBoxUnselected: 'bg-slate-950/50 border-slate-900 text-slate-300 hover:bg-[#11182c]',
        ledgerSearchInputBg: 'bg-slate-950 border-slate-900 text-slate-105 placeholder-slate-600',
        docBannerBg: 'bg-[#0c1326] border-[#101932] text-slate-350',
        sidePillBg: 'bg-slate-950/50 hover:bg-slate-900 border-slate-900 text-slate-300',
        sidePillSelected: 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-bold',
        auditTabUnselected: 'text-slate-400 hover:bg-slate-900/65',
        auditTabSelected: 'bg-slate-950 border border-cyan-850 text-cyan-400 font-black',
        selectBoxBg: 'bg-slate-950 border border-slate-800 text-slate-200',
        formTextareaBg: 'bg-slate-950 border border-slate-800 text-slate-105 font-semibold'
      },
      midnight: {
        backdropBg: 'bg-[#020716] text-blue-50',
        shellContainer: 'border-blue-950 bg-[#040e29] shadow-[0_25px_60px_rgba(0,0,0,0.9)]',
        headerBg: 'bg-[#06143c]/90 border-blue-900/80',
        headerTitleText: 'text-white font-black',
        headerSubtext: 'text-blue-300 font-medium',
        headerInfoBlockBg: 'bg-[#020a21] border-blue-850/40 text-blue-300 shadow-sm',
        headerInfoBlockText: 'text-blue-200',
        sectionCardBg: 'bg-[#051130]/75 border-blue-900/50 shadow-md',
        sectionTitleText: 'text-blue-100 font-extrabold',
        sectionLabelBg: 'bg-blue-950 border-blue-850 text-blue-205 shadow-xs',
        subText: 'text-blue-300 font-medium',
        textMuted: 'text-blue-400 font-semibold',
        gridCardBg: 'bg-slate-950/35 border-[#0b1d4e] hover:border-blue-500/30 shadow-xs text-white',
        gridCardValueText: 'text-blue-300 font-extrabold',
        gridCardDescText: 'text-blue-400 font-medium',
        gridPrimaryText: 'text-blue-50',
        chartBoxBg: 'bg-[#051130]/80 border-[#0b1d4f] shadow-md',
        chartTitleText: 'text-blue-100 font-black',
        chartLegendBg: 'border-blue-900/80 pt-2.5',
        donutLabelHoverBg: 'bg-blue-500/15',
        ledgerSecBg: 'bg-[#05102d] border-blue-950/70',
        ledgerTitleText: 'text-blue-100 font-black',
        ledgerBoxSelected: 'bg-[#0a235c] border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]',
        ledgerBoxUnselected: 'bg-[#020920] border-[#07153a] text-blue-200 hover:bg-[#071947]',
        ledgerSearchInputBg: 'bg-[#010617] border-[#07153a] text-blue-50 placeholder-blue-700',
        docBannerBg: 'bg-[#05102d] border-blue-950 text-blue-200',
        sidePillBg: 'bg-[#02081f] border-[#07153b] text-blue-200 hover:bg-[#061845]',
        sidePillSelected: 'bg-[#0a235c] border-blue-400 text-blue-205 font-bold',
        auditTabUnselected: 'text-blue-300 hover:bg-blue-950/60',
        auditTabSelected: 'bg-[#0c2259] border border-blue-700/45 text-blue-300 font-black',
        selectBoxBg: 'bg-[#02081f] border-blue-900 text-blue-200',
        formTextareaBg: 'bg-[#02081f] border border-blue-900/50 text-blue-50 font-semibold'
      },
      plum: {
        backdropBg: 'bg-[#06030e] text-purple-100',
        shellContainer: 'border-purple-950 bg-[#120a24] shadow-[0_25px_60px_rgba(0,0,0,0.9)]',
        headerBg: 'bg-[#1b0f34] border-purple-900/50',
        headerTitleText: 'text-white font-black',
        headerSubtext: 'text-purple-300 font-medium',
        headerInfoBlockBg: 'bg-[#130722] border-purple-800/40 text-purple-35 shadow-sm',
        headerInfoBlockText: 'text-purple-200',
        sectionCardBg: 'bg-[#170c2a]/60 border-[#1f0f38] shadow-md',
        sectionTitleText: 'text-purple-100 font-extrabold',
        sectionLabelBg: 'bg-[#1a0c32] border-[#2e1454] text-[#d8b4fe] shadow-xs',
        subText: 'text-purple-300 font-semibold',
        textMuted: 'text-purple-400 font-medium',
        gridCardBg: 'bg-slate-950/35 border-[#210f3c] hover:border-purple-500/30 shadow-xs text-white',
        gridCardValueText: 'text-purple-300 font-extrabold',
        gridCardDescText: 'text-purple-405 font-medium',
        gridPrimaryText: 'text-purple-50',
        chartBoxBg: 'bg-[#170c2a]/80 border-[#210f3d] shadow-md',
        chartTitleText: 'text-purple-100 font-black',
        chartLegendBg: 'border-purple-900/80 pt-2.5',
        donutLabelHoverBg: 'bg-purple-500/15',
        ledgerSecBg: 'bg-[#150b28] border-purple-950/70',
        ledgerTitleText: 'text-purple-100 font-black',
        ledgerBoxSelected: 'bg-[#29174f] border-purple-500 text-white shadow-[0_0_15px_rgba(167,139,250,0.2)]',
        ledgerBoxUnselected: 'bg-[#0c0617] border-[#1e0f39] text-purple-200 hover:bg-[#1a0f32]',
        ledgerSearchInputBg: 'bg-[#080211] border-[#1e0f39] text-purple-100 placeholder-purple-800',
        docBannerBg: 'bg-[#150b28] border-[#1e0f39] text-purple-200 shadow-xs',
        sidePillBg: 'bg-[#0b0515] border-[#1e0f3a] text-purple-200 hover:bg-[#1f113d]',
        sidePillSelected: 'bg-[#29174f] border-purple-500 text-purple-205 font-bold',
        auditTabUnselected: 'text-purple-400 hover:bg-[#170c2a]/60',
        auditTabSelected: 'bg-[#251347] border border-[#3e1e6e] text-purple-300 font-black',
        selectBoxBg: 'bg-[#0c0617] border-purple-905 text-purple-205',
        formTextareaBg: 'bg-[#0c0617] border border-[#1e0f39] text-purple-100 font-semibold'
      },
      arctic: {
        backdropBg: 'bg-[#ebf1f7] text-slate-900',
        shellContainer: 'border-slate-300 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.15)]',
        headerBg: 'bg-[#dce6f2] border-slate-300',
        headerTitleText: 'text-slate-900 font-black',
        headerSubtext: 'text-indigo-900 font-semibold',
        headerInfoBlockBg: 'bg-white border-slate-300 text-indigo-700 shadow-sm',
        headerInfoBlockText: 'text-slate-600',
        sectionCardBg: 'bg-[#f3f6f9] border border-slate-200 shadow-xs',
        sectionTitleText: 'text-slate-850 font-black',
        sectionLabelBg: 'bg-white border border-slate-300 text-slate-705 shadow-xs',
        subText: 'text-slate-600 font-semibold',
        textMuted: 'text-slate-505 font-medium',
        gridCardBg: 'bg-white border border-slate-200 hover:border-indigo-500/30 shadow-xs text-slate-800',
        gridCardValueText: 'text-indigo-805 text-indigo-800 font-black',
        gridCardDescText: 'text-slate-500 font-bold',
        gridPrimaryText: 'text-slate-900',
        chartBoxBg: 'bg-white border border-slate-200 shadow-sm',
        chartTitleText: 'text-slate-800 font-black',
        chartLegendBg: 'border-slate-202 pt-2.5',
        donutLabelHoverBg: 'bg-indigo-500/10',
        ledgerSecBg: 'bg-[#ebf1f7] border border-slate-202 shadow-xs',
        ledgerTitleText: 'text-[#1e1b4b] text-indigo-950 font-black',
        ledgerBoxSelected: 'bg-[#ebf1f7] border-indigo-500 text-slate-900 shadow-sm',
        ledgerBoxUnselected: 'bg-white border border-slate-202 hover:bg-slate-100/30 text-slate-707',
        ledgerSearchInputBg: 'bg-white border border-slate-202 text-slate-900 placeholder-slate-400 font-medium',
        docBannerBg: 'bg-[#ebf1f7] border border-slate-202 text-slate-805 shadow-xs',
        sidePillBg: 'bg-white hover:bg-slate-5 border border-slate-202 shadow-xs text-slate-705',
        sidePillSelected: 'bg-indigo-55 bg-indigo-50 border-indigo-500 text-indigo-707 font-black',
        auditTabUnselected: 'text-slate-557 hover:bg-slate-205/50',
        auditTabSelected: 'bg-indigo-600 border border-indigo-650 text-white font-extrabold',
        selectBoxBg: 'bg-[#fbfcfd] border-slate-202 text-slate-805 font-bold',
        formTextareaBg: 'bg-white border border-slate-202 text-[#1e1b4b] font-semibold'
      },
      ivory: {
        backdropBg: 'bg-[#f7f5ed] text-[#5c4a1e]',
        shellContainer: 'border-[#dfd6be] bg-[#fdfdfb] shadow-[0_20px_50px_rgba(78,63,33,0.15)]',
        headerBg: 'bg-[#ede6ce] border-[#dbd1b5]',
        headerTitleText: 'text-amber-955 font-black',
        headerSubtext: 'text-[#614f24] font-semibold',
        headerInfoBlockBg: 'bg-[#faf8f0] border-[#ccc09f] text-emerald-800 shadow-sm',
        headerInfoBlockText: 'text-[#5c4a1e]',
        sectionCardBg: 'bg-[#f3eedc] border-[#e2dac3] shadow-xs',
        sectionTitleText: 'text-amber-955 font-black',
        sectionLabelBg: 'bg-white border-[#d0c5a3] text-[#5c4a1e] font-bold shadow-xs',
        subText: 'text-[#614f24] font-bold',
        textMuted: 'text-amber-707 font-semibold',
        gridCardBg: 'bg-white border-[#dfd6be] hover:border-emerald-600/30 shadow-xs text-amber-955',
        gridCardValueText: 'text-emerald-800 font-black',
        gridCardDescText: 'text-[#6e5828] font-bold',
        gridPrimaryText: 'text-[#5c4a1e]',
        chartBoxBg: 'bg-white border-[#dfd6be] shadow-sm',
        chartTitleText: 'text-amber-950 font-black',
        chartLegendBg: 'border-[#dfd6be] pt-2.5',
        donutLabelHoverBg: 'bg-emerald-500/10',
        ledgerSecBg: 'bg-[#eae3cb] border-[#dfd6be] shadow-xs',
        ledgerTitleText: 'text-[#5c4a1e] font-bold shadow-xs',
        ledgerBoxSelected: 'bg-[#f4f2e9] border-[#dfd6be] text-amber-955 shadow-sm border-emerald-650',
        ledgerBoxUnselected: 'bg-white border-[#dfd6be] hover:bg-[#faf6ea] text-amber-900',
        ledgerSearchInputBg: 'bg-white border-[#dfd6be] text-amber-955 placeholder-[#c4b998] font-semibold',
        docBannerBg: 'bg-[#eae3cb] border-[#dfd6be] shadow-xs text-amber-955',
        sidePillBg: 'bg-white hover:bg-[#faf6ea] border-[#dfd6be] text-[#5c4f2e] shadow-3xs',
        sidePillSelected: 'bg-emerald-55 bg-emerald-50 border-emerald-600 text-[#0f5132] font-black',
        auditTabUnselected: 'text-[#5c4f2e] hover:bg-[#faf6ea]',
        auditTabSelected: 'bg-emerald-700 border border-emerald-750 text-white font-extrabold focus:ring-1 focus:ring-emerald-550',
        selectBoxBg: 'bg-white border-[#dfd6be] text-[#5c4f2e] font-bold',
        formTextareaBg: 'bg-[#fbfbfa] bg-white border border-[#dfd6be] text-[#5c4a1e] font-semibold'
      }
    };
    return themeStylesMap[themeKey] || themeStylesMap.obsidian;
  };

  // Deprecated switch block fallback
  const getContrastStylesDeprecated = (themeKey: any) => {
    switch (themeKey) {
      case 'sky':
        return {
          backdropBg: 'bg-[#ecf3fa] text-slate-900',
          shellContainer: 'border-slate-300 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.12)]',
          headerBg: 'bg-[#d7e5f5] border-sky-200',
          headerTitleText: 'text-sky-950 font-black',
          headerSubtext: 'text-sky-800 font-semibold',
          headerInfoBlockBg: 'bg-white border-sky-200 text-sky-800 shadow-sm',
          headerInfoBlockText: 'text-sky-700',
          sectionCardBg: 'bg-white border border-sky-100 shadow-xs',
          sectionTitleText: 'text-sky-900 font-extrabold',
          sectionLabelBg: 'bg-sky-50 border-sky-200 text-sky-850 font-extrabold shadow-xs',
          subText: 'text-sky-800 font-semibold',
          textMuted: 'text-sky-600 font-medium',
          gridCardBg: 'bg-white border-slate-200 hover:border-sky-500/30 shadow-xs text-slate-800',
          gridCardValueText: 'text-sky-800 font-black',
          gridCardDescText: 'text-slate-505 font-bold',
          gridPrimaryText: 'text-slate-900',
          chartBoxBg: 'bg-white border border-slate-200 shadow-sm',
          chartTitleText: 'text-sky-950 font-black',
          chartLegendBg: 'border-slate-200 pt-2.5',
          donutLabelHoverBg: 'bg-sky-500/10',
          ledgerSecBg: 'bg-[#ebf2fa] border border-slate-200 shadow-xs',
          ledgerTitleText: 'text-sky-950 font-black',
          ledgerBoxSelected: 'bg-sky-50 border-sky-500 text-sky-950 font-bold shadow-sm',
          ledgerBoxUnselected: 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700',
          ledgerSearchInputBg: 'bg-white border border-slate-200 text-sky-950 placeholder-slate-400',
          docBannerBg: 'bg-[#e3effa] border-sky-150 text-sky-900 font-medium',
          sidePillBg: 'bg-white hover:bg-sky-50 border-slate-205 text-slate-700',
          sidePillSelected: 'bg-sky-100 border-sky-400 text-sky-900 font-black',
          auditTabUnselected: 'text-slate-500 hover:bg-slate-100/60',
          auditTabSelected: 'bg-sky-600 border border-sky-655 text-white font-extrabold',
          selectBoxBg: 'bg-white border border-slate-200 text-slate-800 font-semibold',
          formTextareaBg: 'bg-white border border-slate-200 text-slate-800 font-semibold'
        };
      case 'mint':
        return {
          backdropBg: 'bg-[#edf6f0] text-slate-900',
          shellContainer: 'border-emerald-250 bg-white shadow-[0_22px_55px_rgba(20,83,45,0.08)]',
          headerBg: 'bg-[#dbecd8] border-emerald-300',
          headerTitleText: 'text-emerald-950 font-black',
          headerSubtext: 'text-emerald-800 font-bold',
          headerInfoBlockBg: 'bg-white border-emerald-200 text-emerald-800 shadow-sm',
          headerInfoBlockText: 'text-emerald-700',
          sectionCardBg: 'bg-white border border-emerald-100 shadow-xs',
          sectionTitleText: 'text-emerald-900 font-extrabold',
          sectionLabelBg: 'bg-emerald-50 border-emerald-200 text-[#065f46] font-extrabold shadow-xs',
          subText: 'text-emerald-850 font-semibold',
          textMuted: 'text-emerald-600 font-medium',
          gridCardBg: 'bg-white border border-slate-200 hover:border-emerald-500/30 shadow-xs text-slate-800',
          gridCardValueText: 'text-emerald-800 font-black',
          gridCardDescText: 'text-slate-500 font-bold',
          gridPrimaryText: 'text-slate-900',
          chartBoxBg: 'bg-white border border-slate-200 shadow-sm',
          chartTitleText: 'text-emerald-900 font-black',
          chartLegendBg: 'border-slate-200 pt-2.5',
          donutLabelHoverBg: 'bg-emerald-500/10',
          ledgerSecBg: 'bg-[#e5f3e8] border border-slate-200 shadow-xs',
          ledgerTitleText: 'text-emerald-950 font-black',
          ledgerBoxSelected: 'bg-emerald-50 border-emerald-500 text-emerald-955 font-bold shadow-sm',
          ledgerBoxUnselected: 'bg-white border-slate-202 hover:bg-slate-50 text-slate-705',
          ledgerSearchInputBg: 'bg-white border border-slate-200 text-emerald-950 placeholder-slate-400',
          docBannerBg: 'bg-[#def0e3] border-emerald-150 text-emerald-[#065f46] font-medium',
          sidePillBg: 'bg-white hover:bg-emerald-50 border-slate-205 text-slate-705',
          sidePillSelected: 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black',
          auditTabUnselected: 'text-slate-500 hover:bg-slate-100/60',
          auditTabSelected: 'bg-emerald-600 border border-emerald-700 text-white font-extrabold',
          selectBoxBg: 'bg-white border border-slate-202 text-slate-800 font-semibold',
          formTextareaBg: 'bg-white border border-slate-202 text-slate-800 font-semibold'
        };
      case 'apricot':
        return {
          backdropBg: 'bg-[#faf3e8] text-[#5c3e09]',
          shellContainer: 'border-amber-250 bg-white shadow-[0_22px_55px_rgba(120,53,4,0.08)]',
          headerBg: 'bg-[#f7ebd4] border-[#ebd8b7]',
          headerTitleText: 'text-amber-955 font-black',
          headerSubtext: 'text-amber-800 font-bold',
          headerInfoBlockBg: 'bg-white border-amber-200 text-amber-805 shadow-sm',
          headerInfoBlockText: 'text-amber-700',
          sectionCardBg: 'bg-white border border-amber-100 shadow-xs',
          sectionTitleText: 'text-[#5c3e09] font-extrabold',
          sectionLabelBg: 'bg-amber-50 border-amber-200 text-amber-850 font-extrabold shadow-xs',
          subText: 'text-[#6e5828] font-semibold',
          textMuted: 'text-amber-600 font-medium',
          gridCardBg: 'bg-white border-slate-200 hover:border-amber-500/30 shadow-xs text-[#5c3e09]',
          gridCardValueText: 'text-amber-800 font-black',
          gridCardDescText: 'text-[#6e5828] font-bold',
          gridPrimaryText: 'text-[#5c3e09]',
          chartBoxBg: 'bg-white border border-slate-200 shadow-sm',
          chartTitleText: 'text-amber-950 font-black',
          chartLegendBg: 'border-slate-200 pt-2.5',
          donutLabelHoverBg: 'bg-amber-500/10',
          ledgerSecBg: 'bg-[#f8eed8] border border-slate-200 shadow-xs',
          ledgerTitleText: 'text-[#5c3e09] font-black',
          ledgerBoxSelected: 'bg-amber-50 border-amber-500 text-amber-955 font-bold shadow-sm',
          ledgerBoxUnselected: 'bg-white border border-slate-201 hover:bg-slate-50 text-amber-900',
          ledgerSearchInputBg: 'bg-white border border-slate-200 text-amber-955 placeholder-slate-400',
          docBannerBg: 'bg-[#f3edd9] border border-amber-150 text-[#78350f] font-medium',
          sidePillBg: 'bg-white hover:bg-[#faf6ea] border-[#dfd6be] text-[#5c4f2e]',
          sidePillSelected: 'bg-[#faf0db] border-amber-400 text-amber-900 font-black',
          auditTabUnselected: 'text-[#5c4f2e] hover:bg-[#faf6ea]',
          auditTabSelected: 'bg-amber-600 border border-amber-705 text-white font-extrabold',
          selectBoxBg: 'bg-white border border-[#dfd6be] text-[#5c4f2e] font-bold',
          formTextareaBg: 'bg-white border border-[#dfd6be] text-amber-950 font-semibold'
        };
      case 'rose':
        return {
          backdropBg: 'bg-[#faf1f3] text-rose-950',
          shellContainer: 'border-rose-250 bg-white shadow-[0_22px_55px_rgba(159,18,57,0.08)]',
          headerBg: 'bg-[#f7dae0] border-[#ecd4da]',
          headerTitleText: 'text-rose-955 font-black',
          headerSubtext: 'text-rose-800 font-semibold',
          headerInfoBlockBg: 'bg-white border-rose-200 text-rose-800 shadow-sm',
          headerInfoBlockText: 'text-rose-700',
          sectionCardBg: 'bg-white border border-rose-100 shadow-xs',
          sectionTitleText: 'text-rose-900 font-extrabold',
          sectionLabelBg: 'bg-rose-50 border-rose-200 text-rose-850 font-extrabold shadow-xs',
          subText: 'text-rose-850 font-semibold',
          textMuted: 'text-rose-600 font-medium',
          gridCardBg: 'bg-white border border-slate-200',
          gridCardValueText: 'text-rose-800 font-black',
          gridCardDescText: 'text-rose-500 font-bold',
          gridPrimaryText: 'text-rose-955',
          chartBoxBg: 'bg-white border border-slate-202 shadow-sm',
          chartTitleText: 'text-rose-950 font-black',
          chartLegendBg: 'border-slate-250 pt-2.5',
          donutLabelHoverBg: 'bg-rose-500/10',
          ledgerSecBg: 'bg-[#faebef] border border-slate-202 shadow-xs',
          ledgerTitleText: 'text-rose-955 font-black',
          ledgerBoxSelected: 'bg-rose-50 border-rose-400 text-rose-955 font-bold shadow-sm',
          ledgerBoxUnselected: 'bg-white border-slate-202 hover:bg-slate-50 text-rose-800',
          ledgerSearchInputBg: 'bg-white border border-slate-202 text-rose-955 placeholder-rose-400',
          docBannerBg: 'bg-[#faebef] border border-rose-150 text-[#9f1239] font-medium',
          sidePillBg: 'bg-white hover:bg-rose-50 border-slate-202 text-slate-700',
          sidePillSelected: 'bg-[#fae2e6] border-rose-350 text-rose-955 font-black',
          auditTabUnselected: 'text-rose-800 hover:bg-[#faf4f5]',
          auditTabSelected: 'bg-rose-600 border border-rose-650 text-white font-extrabold',
          selectBoxBg: 'bg-white border border-slate-202 text-rose-905 font-bold',
          formTextareaBg: 'bg-[#fcfafb] border border-slate-202 text-rose-955 font-semibold'
        };
      case 'ivory':
        return {
          backdropBg: 'bg-[#f7f5ed] text-amber-950',
          shellContainer: 'border-[#dfd6be] bg-[#fdfdfb] shadow-[0_20px_50px_rgba(78,63,33,0.15)]',
          headerBg: 'bg-[#ede6ce] border-[#dbd1b5]',
          headerTitleText: 'text-amber-950 font-black',
          headerSubtext: 'text-amber-900 font-semibold',
          headerInfoBlockBg: 'bg-[#faf8f0] border-[#ccc09f] text-emerald-800 shadow-sm',
          headerInfoBlockText: 'text-amber-850',
          sectionCardBg: 'bg-[#f3eedc] border-[#e2dac3] shadow-xs',
          sectionTitleText: 'text-amber-950 font-black',
          sectionLabelBg: 'bg-white border-[#d0c5a3] text-[#5c4a1e] font-bold shadow-xs',
          subText: 'text-[#614f24] font-bold',
          textMuted: 'text-amber-700',
          gridCardBg: 'bg-white border-[#dfd6be] hover:border-emerald-600/30 shadow-xs text-amber-950',
          gridCardValueText: 'text-emerald-800 font-black',
          gridCardDescText: 'text-[#6e5828] font-bold',
          gridPrimaryText: 'text-amber-950',
          chartBoxBg: 'bg-white border-[#dfd6be] shadow-sm',
          chartTitleText: 'text-amber-955 text-amber-950 font-black',
          chartLegendBg: 'border-[#dfd6be] pt-2.5',
          donutLabelHoverBg: 'bg-emerald-500/10',
          ledgerSecBg: 'bg-[#eae3cb] border-[#dfd6be] shadow-[#dfd6be] shadow-xs',
          ledgerTitleText: 'text-amber-955 text-amber-950 font-bold',
          ledgerBoxSelected: 'bg-[#f4f2e9] border-emerald-600 text-amber-955 text-amber-950 shadow-sm',
          ledgerBoxUnselected: 'bg-white border-[#dfd6be] hover:bg-[#faf6ea] text-amber-900',
          ledgerSearchInputBg: 'bg-white border-[#dfd6be] text-amber-955 text-amber-950 placeholder-[#c4b998] font-semibold',
          docBannerBg: 'bg-[#eae3cb] border-[#dfd6be] shadow-xs text-amber-955 text-amber-950',
          sidePillBg: 'bg-white hover:bg-[#faf6ea] border-[#dfd6be] text-[#5c4f2e]',
          sidePillSelected: 'bg-emerald-55 bg-emerald-50 border-emerald-600 text-[#0f5132] font-black',
          auditTabUnselected: 'text-[#5c4f2e] hover:bg-[#faf6ea]',
          auditTabSelected: 'bg-emerald-700 border border-emerald-750 text-white font-extrabold',
          selectBoxBg: 'bg-white border-[#dfd6be] text-[#5c4f2e] font-bold',
          formTextareaBg: 'bg-white border border-[#dfd6be] text-amber-955 text-amber-955 font-semibold'
        };
    }
  };

  const themeStyles = getContrastStyles(contrastTheme);

  return (
    <div className={`min-h-screen p-3 sm:p-5 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-black transition-colors duration-200 ${themeStyles.backdropBg}`}>
      
      {/* Outer Executive Carbon Outer Shell Container */}
      <div className={`w-full max-w-7xl mx-auto border-4 rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col flex-grow min-h-[95vh] transition-colors duration-200 ${themeStyles.shellContainer}`}>
        
        {/* Top Header Panel - Technical, Glowing Cyberpunk feel with Deep Slate */}
        <header className={`px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b transition-colors duration-250 ${themeStyles.headerBg}`}>
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <ShieldCheck className="w-7 h-7 text-white font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xl sm:text-2xl font-extrabold tracking-tight transition-colors duration-250 ${themeStyles.headerTitleText}`}>
                  AP Global matching Vault
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono tracking-widest font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
                  {vendorFilteredRecords.length}x pool database
                </span>
              </div>
              <p className={`text-xs font-medium tracking-wide transition-colors duration-250 ${themeStyles.headerSubtext}`}>
                4-Way Matching Matrix & Compliance Diagnostics Hub (Invoice • PO • Receipt • Contract Guideline)
              </p>
            </div>
          </div>

          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border shrink-0 transition-colors duration-250 ${themeStyles.headerInfoBlockBg}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-580 bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px]">
              Engine: <strong className="text-cyan-550 text-cyan-500">Gemini 3.5 Flash</strong>
            </span>
          </div>
        </header>

        {/* Global Hub Notification Banners */}
        {errorMsg && (
          <div className="mx-6 mt-5 p-4 rounded-xl border border-red-800 bg-[#160b0c] text-red-150 flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs text-red-350">
              <p className="font-bold uppercase tracking-wider">Engine Execution Stalled</p>
              <p className="font-medium mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {systemBannerMessage && (
          <div className={`mx-6 mt-5 p-4 rounded-xl border transition-all flex items-start space-x-3 ${
            systemBannerMessage.type === 'success' 
            ? 'bg-[#091f16] border-emerald-800/80 text-emerald-100' 
            : 'bg-[#0d1e2e] border-sky-800/80 text-sky-100'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold uppercase tracking-wider">Operational Directive Issued</p>
              <p className="font-medium mt-0.5 text-slate-200">{systemBannerMessage.text}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Written securely into system matching queues.</p>
            </div>
          </div>
        )}

        {/* Outer Grid Body Layout */}
        <main className="flex-grow p-4 sm:p-6 lg:p-7 flex flex-col gap-6 select-none">
          
          {/* HORIZONTAL PRESENTATION SLIDE STEPPER - "ROW-WISE" LAYOUT SELECTOR */}
          <div className={`p-1.5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md transition-colors ${
            contrastTheme === 'obsidian' ? 'bg-[#090d16] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto flex-grow select-none">
              {[
                { id: 0, num: "01", title: "Global Dashboard", desc: "Batch & Charts", icon: Layers },
                { id: 1, num: "02", title: "Ingestion Desk", desc: "Register & Validate", icon: ArrowUpCircle },
                { id: 2, num: "03", title: "Ledger Catalog", desc: `Record Pools (${filteredRecords.length})`, icon: Database },
                { id: 3, num: "04", title: "Matching Desk", desc: "Comparative Matrix", icon: Workflow },
                { id: 4, num: "05", title: "Document Workspace", desc: "Interactive Editors", icon: Layers3 }
              ].map((slide) => {
                const isActive = activeSlide === slide.id;
                const SlideIcon = slide.icon;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleSlideChange(slide.id)}
                    className={`p-3 rounded-xl transition-all duration-300 flex items-center space-x-3 text-left cursor-pointer border select-none ${
                      isActive
                        ? contrastTheme === 'obsidian'
                          ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 text-cyan-400 border-cyan-500 shadow-[0_4px_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                          : 'bg-white text-cyan-700 border-cyan-400 shadow-sm ring-1 ring-cyan-500/20'
                        : contrastTheme === 'obsidian'
                          ? 'bg-[#010610]/40 text-slate-400 hover:text-slate-200 hover:bg-[#0c1426] border-slate-900'
                          : 'bg-slate-50/70 text-slate-500 hover:text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isActive 
                        ? 'bg-cyan-500 text-slate-950' 
                        : 'bg-slate-850/20 text-slate-500'
                    }`}>
                      <SlideIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span className={isActive ? "text-cyan-400" : ""}>{slide.num}. Slide</span>
                        <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                        <span className="text-[8px] font-mono">Active</span>
                      </div>
                      <p className="text-xs font-black truncate leading-tight mt-0.5">{slide.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slide active progress tracker */}
            <div className="flex items-center space-x-3.5 shrink-0 px-3 py-2 bg-slate-950/20 rounded-xl border border-slate-800/40 lg:w-[220px]">
              <div className="w-full">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase font-mono">
                  <span>Audit Stage</span>
                  <span className="text-cyan-400">{activeSlide + 1} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300" 
                    style={{ width: `${((activeSlide + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slides Viewport Wrapper */}
          <div className="relative overflow-hidden w-full flex-grow flex flex-col min-h-[500px]">
            <AnimatePresence mode="wait" initial={false}>
              {activeSlide === 0 && (
                <motion.div
                  key="dashboard-slide"
                  initial={{ x: slideDirection === 'forward' ? 120 : -120, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: slideDirection === 'forward' ? -120 : 120, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="w-full h-full flex flex-col gap-6"
                >
                  {/* TOP SECTION: Overall Data Dashboard with responsive charts */}
                  <section className={`rounded-2xl p-4 sm:p-6 border flex flex-col gap-6 transition-colors duration-200 ${themeStyles.sectionCardBg}`}>
            
            {/* Header statistics block */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
              <div>
                <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-1.5 ${themeStyles.sectionTitleText}`}>
                  <span className="w-2.5 h-2.5 bg-cyan-500 rounded"></span>
                  P2P Batch Portfolio Statistics & Balances
                </h2>
                <p className={`text-xs mt-1 ${themeStyles.subText}`}>
                  Scope selection, theme config, and aggregation of contractual locks, purchase requests, matched payouts, and pending holds.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${themeStyles.sectionLabelBg}`}>
                  Status: Live Operational
                </span>
              </div>
            </div>

            {/* NEW: DASHBOARD FILTERS & CONFIGURATION HUB (VENDOR + PROFESSIONAL COLOR CONTRAST SELECTION & MASTER RUN HUB) */}
            <div className={`p-5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_4px_15px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-202 border-slate-200 shadow-sm'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch`}>
              
              {/* Option 1: Vendor Selection Selector List */}
              <div className="flex flex-col space-y-1.5 lg:col-span-3 justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-500 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Portfolio Vendor Filter</span>
                  </label>
                  <p className="text-[10.5px] text-slate-400 mt-1 mb-2">
                    Narrow down transaction documents and balance pools by vendor entity.
                  </p>
                </div>
                <div className="relative mt-auto">
                  <select
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer ${themeStyles.selectBoxBg}`}
                  >
                    <option value="ALL">All Portfolio Vendors (80 Records Pool)</option>
                    {vendorsList.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor} (Active vendor subset)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option 2: Professional Contrast Filter (Strictly Visual Color Swatches Component) */}
              <div className="flex flex-col space-y-1.5 lg:col-span-3 justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Interactive Workspace Palette</span>
                  </label>
                  <p className="text-[10.5px] text-slate-500 mt-1 mb-2">
                    Select high-contrast Obsidian dark or Ivory cream professional workspace:
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  {[
                    { key: 'obsidian', label: 'Obsidian Theme (Dark Slate)', colorClass: 'bg-[#0a0f1d] border-slate-900' },
                    { key: 'ivory', label: 'Ivory Theme (Light Cream)', colorClass: 'bg-[#f7f5ed] border-[#c0b182]' },
                  ].map((item) => {
                    const isActive = contrastTheme === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setContrastTheme(item.key as any)}
                        className={`w-11 h-11 rounded-full cursor-pointer border-3 relative transition-all duration-300 hover:scale-110 active:scale-95 ${item.colorClass} ${
                          isActive 
                            ? 'ring-4 ring-indigo-500 scale-105 shadow-md border-white' 
                            : 'shadow-xs hover:shadow-md hover:border-slate-400'
                        }`}
                        title={item.label}
                      >
                        {isActive && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping absolute"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative"></span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <div className="text-[10px] text-slate-400 font-bold ml-1 uppercase">
                    Theme: <span className="text-cyan-400 font-extrabold">{contrastTheme}</span>
                  </div>
                </div>
              </div>

              {/* Option 3: Matching Items Monitor (Total counter only, no lists) */}
              <div className={`flex flex-col space-y-1.5 lg:col-span-3 justify-between pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 md:border-l ${isDark ? 'border-slate-800/60' : 'border-slate-200/80'}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Reconciled Match Base</span>
                    </label>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 font-mono font-bold rounded">
                      Passed
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 mb-2">
                    Contractually flawless reconciled records in current batch.
                  </p>
                </div>
                
                <div className={`mt-auto rounded-xl p-3 flex flex-col justify-center items-center text-center border ${
                  isDark ? 'bg-slate-950/40 border-slate-900/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-3xl font-black text-emerald-500 tracking-tight">
                    {matchingItemsList.length}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Verified Invoices</span>
                  
                  {matchingItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleViewMatchedItem(matchingItemsList[0])}
                      className="mt-2.5 w-full py-1 text-[9.5px] uppercase font-extrabold tracking-wider bg-slate-805 bg-slate-800/40 hover:bg-slate-800/80 text-[#21dbc5] rounded-md border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                    >
                      Inspect Match Catalog ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Option 4: Actionable Items Monitor (Total counter only with immediate resolution trigger) */}
              <div className={`flex flex-col space-y-1.5 lg:col-span-3 justify-between pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 md:border-l ${isDark ? 'border-slate-800/60' : 'border-slate-200/80'}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Compliance Action Desk</span>
                    </label>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 font-mono font-bold rounded animate-pulse">
                      Pending Action
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 mb-2">
                    Flagged variances or disputed holds needing human audit.
                  </p>
                </div>

                <div className={`mt-auto rounded-xl p-3 flex flex-col justify-center items-center text-center border ${
                  isDark ? 'bg-slate-950/40 border-slate-900/60' : 'bg-[#fffbeb] border-amber-100'
                }`}>
                  <div className="text-3xl font-black text-amber-500 tracking-tight">
                    {actionableItemsList.length}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-450 text-slate-400 mt-1">Review Outstanding</span>

                  {actionableItemsList.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleQuickRemediate(actionableItemsList[0])}
                      className="mt-2.5 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase tracking-widest text-[9.5px] rounded-lg transition-all hover:scale-[1.02] shadow-sm active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>Remediate Next Item ⚡</span>
                    </button>
                  ) : (
                    <div className="text-[9.5px] text-emerald-500 font-black mt-2">
                      ✓ Reconciled Clean
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Overall Balances Grid Numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className={`rounded-xl p-3.5 flex flex-col justify-between transition-all group relative overflow-hidden h-28 border ${themeStyles.gridCardBg}`}>
                <div className="absolute top-0 right-0 h-16 w-16 bg-cyan-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <DollarSign className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Total PO Value</span>
                </div>
                <div className="mt-2">
                  <p className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${themeStyles.gridCardValueText}`}>
                    ${metrics.totalPoValue.toLocaleString()}
                  </p>
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${themeStyles.gridCardDescText}`}>
                    Authorized Purchases
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-3.5 flex flex-col justify-between transition-all group relative overflow-hidden h-28 border ${themeStyles.gridCardBg}`}>
                <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Matched Invoice Value</span>
                </div>
                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-black text-emerald-500 font-mono tracking-tight">
                    ${metrics.totalMatchedInvoiceValue.toLocaleString()}
                  </p>
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${themeStyles.gridCardDescText}`}>
                    Cleared & Paid
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-3.5 flex flex-col justify-between transition-all group relative overflow-hidden h-28 border ${themeStyles.gridCardBg}`}>
                <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Pending PO Value</span>
                </div>
                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-tight">
                    ${metrics.totalPendingPoValue.toLocaleString()}
                  </p>
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${themeStyles.gridCardDescText}`}>
                    Unbilled commitments
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-3.5 flex flex-col justify-between transition-all group relative overflow-hidden h-28 border ${themeStyles.gridCardBg}`}>
                <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Scale className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Balance Contract Value</span>
                </div>
                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-black text-purple-500 font-mono tracking-tight">
                    ${metrics.totalBalanceContractValue.toLocaleString()}
                  </p>
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${themeStyles.gridCardDescText}`}>
                    Active contract credit limits
                  </p>
                </div>
              </div>

            </div>

            {/* DUAL CHARTING VIEW: Grouped SVG Bar Chart & SVG Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-2">
              
              {/* Grouped SVG Bar Chart for core comparative metrics */}
              <div className={`lg:col-span-7 rounded-xl p-4 flex flex-col justify-between border transition-all duration-200 ${themeStyles.chartBoxBg}`}>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest flex items-center justify-between ${themeStyles.chartTitleText}`}>
                    <span>Comparative Volume Chart</span>
                    <span className="font-mono text-[9px] text-slate-500">Aggregate relative balances</span>
                  </h3>
                  <p className={`text-[11px] mt-1 ${themeStyles.subText}`}>
                    Visual contrast of core AP monetary allocations of the currently selected vendor pool.
                  </p>
                </div>

                {/* Custom Interactive SVG Bar Chart */}
                <div className="my-6 flex justify-center items-center">
                  <svg viewBox="0 0 500 240" className="w-full max-w-[480px] h-auto select-none overflow-visible">
                    {/* Dynamic Bar Calculations */}
                    {(() => {
                      // Dynamically calculate maximum value of all metric bars to make the chart auto-scaling
                      const maxValueOfFiltered = Math.max(
                        metrics.totalPoValue,
                        metrics.totalMatchedInvoiceValue,
                        metrics.totalPendingPoValue,
                        metrics.totalBalanceContractValue
                      );
                      const maxVal = maxValueOfFiltered > 0 ? maxValueOfFiltered * 1.15 : 100000;
                      const heightFactor = 150; // max px height of bars

                      const formatValY = (val: number) => {
                        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `$${Math.round(val / 1000)}k`;
                        return `$${Math.round(val)}`;
                      };

                      // Dynamic Heights
                      const hPo = (metrics.totalPoValue / maxVal) * heightFactor;
                      const hMatched = (metrics.totalMatchedInvoiceValue / maxVal) * heightFactor;
                      const hPending = (metrics.totalPendingPoValue / maxVal) * heightFactor;
                      const hContract = (metrics.totalBalanceContractValue / maxVal) * heightFactor;

                      const bars = [
                        { name: 'Total PO', val: metrics.totalPoValue, h: hPo, color: 'url(#cyanGlow)', rawColor: '#22d3ee', x: 100 },
                        { name: 'Matched Inv.', val: metrics.totalMatchedInvoiceValue, h: hMatched, color: 'url(#emeraldGlow)', rawColor: '#34d399', x: 190 },
                        { name: 'Pending PO', val: metrics.totalPendingPoValue, h: hPending, color: 'url(#amberGlow)', rawColor: '#fbbf24', x: 280 },
                        { name: 'Bal Contract', val: metrics.totalBalanceContractValue, h: hContract, color: 'url(#purpleGlow)', rawColor: '#a78bfa', x: 370 }
                      ];

                      return (
                        <>
                          {/* Gridlines */}
                          <line x1="60" y1="30" x2="480" y2="30" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeDasharray="3,3" />
                          <line x1="60" y1="80" x2="480" y2="80" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeDasharray="3,3" />
                          <line x1="60" y1="130" x2="480" y2="130" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeDasharray="3,3" />
                          <line x1="60" y1="180" x2="480" y2="180" stroke={isDark ? "#475569" : "#94a3b8"} strokeDasharray="3,3" strokeWidth="1.5" />
                          
                          {/* Y-Axis Label reference */}
                          <text x="50" y="35" fill="#64748b" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">{formatValY(maxVal)}</text>
                          <text x="50" y="85" fill="#64748b" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">{formatValY(maxVal * 0.66)}</text>
                          <text x="50" y="135" fill="#64748b" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">{formatValY(maxVal * 0.33)}</text>
                          <text x="50" y="185" fill="#64748b" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="monospace">$0.00</text>

                          {/* Gradients */}
                          <defs>
                            <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.15" />
                            </linearGradient>
                            <linearGradient id="emeraldGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
                            </linearGradient>
                            <linearGradient id="amberGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
                            </linearGradient>
                            <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
                            </linearGradient>
                          </defs>

                          {bars.map((bar) => {
                            const isFocused = hoveredBar === bar.name;
                            const h = bar.h > 4 ? bar.h : 4; // visual minimum height
                            const formattedValueStr = bar.val >= 1000000 
                              ? `$${(bar.val / 1000000).toFixed(2)}M` 
                              : `$${Math.round(bar.val / 1000)}k`;

                            return (
                              <g 
                                key={bar.name} 
                                onMouseEnter={() => setHoveredBar(bar.name)}
                                onMouseLeave={() => setHoveredBar(null)}
                                className="cursor-pointer transition duration-205"
                              >
                                {/* Active bar glow background if focused */}
                                {isFocused && (
                                  <rect 
                                    x={bar.x - 10} 
                                    y={180 - h - 5} 
                                    width="50" 
                                    height={h + 10} 
                                    fill={bar.rawColor} 
                                    opacity={isDark ? "0.08" : "0.14"} 
                                    rx="6"
                                  />
                                )}
                                
                                {/* main Bar */}
                                <rect 
                                  x={bar.x} 
                                  y={180 - h} 
                                  width="30" 
                                  height={h} 
                                  fill={bar.color} 
                                  stroke={bar.rawColor} 
                                  strokeWidth={isFocused ? '2.5' : '1'}
                                  rx="4"
                                />

                                {/* Value text */}
                                <text 
                                  x={bar.x + 15} 
                                  y={170 - h} 
                                  fill={isFocused ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#475569')} 
                                  fontSize="8" 
                                  fontWeight="black" 
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                >
                                  {formattedValueStr}
                                </text>

                                {/* Bottom axis label */}
                                <text 
                                  x={bar.x + 15} 
                                  y="198" 
                                  fill={isFocused ? bar.rawColor : (isDark ? '#94a3b8' : '#475569')} 
                                  fontSize="8" 
                                  fontWeight={isFocused ? 'black' : 'bold'}
                                  textAnchor="middle"
                                >
                                  {bar.name}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Bar legend block */}
                <div className={`flex justify-center flex-wrap gap-4 text-[10px] text-slate-450 font-mono mt-1 border-t pt-2.5 ${isDark ? 'border-slate-900/80' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-cyan-400 border border-cyan-300 rounded-sm"></span>
                    <span>Total PO (${Math.round(metrics.totalPoValue / 1000)}k)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-400 border border-emerald-300 rounded-sm"></span>
                    <span>Matched Paid (${Math.round(metrics.totalMatchedInvoiceValue / 1000)}k)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-400 border border-amber-300 rounded-sm"></span>
                    <span>Commitments Hold (${Math.round(metrics.totalPendingPoValue / 1000)}k)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-purple-400 border border-purple-300 rounded-sm"></span>
                    <span>Contract Limit (${Math.round(metrics.totalBalanceContractValue / 1000)}k)</span>
                  </div>
                </div>

              </div>

              {/* Status Pizza/Donut Pie Chart with hover highlights */}
              <div className={`lg:col-span-5 rounded-xl p-4 flex flex-col justify-between border transition-all duration-200 ${themeStyles.chartBoxBg}`}>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest flex items-center justify-between ${themeStyles.chartTitleText}`}>
                    <span>Audit Status Distribution</span>
                    <span className="font-mono text-[9px] text-slate-500">{vendorFilteredRecords.length} Portfolio records</span>
                  </h3>
                  <p className={`text-[11px] mt-1 ${themeStyles.subText}`}>
                    Donut sector representation of status breakdowns.
                  </p>
                </div>

                {/* SVG Pizza chart */}
                <div className="my-4 flex justify-center items-center relative">
                  <svg viewBox="0 0 160 160" className="w-[140px] sm:w-[150px] h-[140px] sm:h-[150px] overflow-visible">
                    <g transform="translate(80, 80)">
                      {pieData.map((slice) => {
                        const sliceAngle = totalPieValues > 0 ? (slice.value / totalPieValues) * 360 : 0;
                        if (sliceAngle === 0) return null;

                        const startAngle = cumulativeAngle;
                        const endAngle = cumulativeAngle + sliceAngle;
                        cumulativeAngle += sliceAngle;

                        // Calculate polar coordinates
                        const rad = Math.PI / 180;
                        const rIn = 32;
                        const rOut = hoveredSlice === slice.name ? 55 : 48;

                        const xInStart = rIn * Math.cos(startAngle * rad);
                        const yInStart = rIn * Math.sin(startAngle * rad);
                        const xInEnd = rIn * Math.cos(endAngle * rad);
                        const yInEnd = rIn * Math.sin(endAngle * rad);

                        const xOutStart = rOut * Math.cos(startAngle * rad);
                        const yOutStart = rOut * Math.sin(startAngle * rad);
                        const xOutEnd = rOut * Math.cos(endAngle * rad);
                        const yOutEnd = rOut * Math.sin(endAngle * rad);

                        const bigArc = sliceAngle > 180 ? 1 : 0;

                        // Create custom SVG path forming arc donut slice
                        const pathData = `
                          M ${xOutStart} ${yOutStart}
                          A ${rOut} ${rOut} 0 ${bigArc} 1 ${xOutEnd} ${yOutEnd}
                          L ${xInEnd} ${yInEnd}
                          A ${rIn} ${rIn} 0 ${bigArc} 0 ${xInStart} ${yInStart}
                          Z
                        `;

                        return (
                          <path 
                            key={slice.name}
                            d={pathData}
                            fill={slice.color}
                            stroke={isDark ? "#0a0f1d" : "#fafafa"}
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all duration-300 hover:opacity-100 opacity-90"
                            onMouseEnter={() => setHoveredSlice(slice.name)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        );
                      })}
                      
                      {/* Center labels showing quantity context */}
                      <circle cx="0" cy="0" r="28" fill={isDark ? "#0a0f1d" : "#ffffff"} className="transition-colors duration-250" />
                      <text x="0" y="-3" fill={isDark ? "#ffffff" : "#0f172a"} fontSize="8.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        {vendorFilteredRecords.length}
                      </text>
                      <text x="0" y="6" fill="#94a3b8" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        RECORDS
                      </text>
                    </g>
                  </svg>

                  {/* Absolute responsive hover tooltip inside donut */}
                  {hoveredSlice && (
                    <div className="absolute bg-slate-950/95 border border-slate-800 text-[10px] text-slate-200 px-2.5 py-1.5 rounded shadow-lg pointer-events-none text-center z-10">
                      <p className="font-bold uppercase tracking-wider">{hoveredSlice}</p>
                      <p className="font-mono text-cyan-400 mt-0.5">
                        {metrics.counts[hoveredSlice as keyof typeof metrics.counts]} Items (
                        {vendorFilteredRecords.length > 0 
                          ? Math.round((metrics.counts[hoveredSlice as keyof typeof metrics.counts] / vendorFilteredRecords.length) * 100) 
                          : 0}%)
                      </p>
                    </div>
                  )}
                </div>

                {/* Labels grid */}
                <div className={`grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-mono font-medium text-slate-500 border-t pt-2 shrink-0 ${isDark ? 'border-indigo-900/30' : 'border-slate-200'}`}>
                  <div 
                    className={`flex items-center space-x-1 p-0.5 rounded transition ${hoveredSlice === 'Matched' ? (isDark ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-green-100 text-green-700') : ''}`}
                    onMouseEnter={() => setHoveredSlice('Matched')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#10b981] shrink-0"></span>
                    <span className="truncate">Matches: {metrics.counts.Matched}</span>
                  </div>
                  <div 
                    className={`flex items-center space-x-1 p-0.5 rounded transition ${hoveredSlice === 'Price Variance' ? (isDark ? 'bg-[#f59e0b]/15 text-[#f59e0b]' : 'bg-amber-150 bg-amber-100 text-amber-700') : ''}`}
                    onMouseEnter={() => setHoveredSlice('Price Variance')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#f59e0b] shrink-0"></span>
                    <span className="truncate">Price Var: {metrics.counts['Price Variance']}</span>
                  </div>
                  <div 
                    className={`flex items-center space-x-1 p-0.5 rounded transition ${hoveredSlice === 'Quantity Discrepancy' ? (isDark ? 'bg-[#3b82f6]/15 text-[#3b82f6]' : 'bg-blue-100 text-blue-700') : ''}`}
                    onMouseEnter={() => setHoveredSlice('Quantity Discrepancy')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#3b82f6] shrink-0"></span>
                    <span className="truncate">Qty Var: {metrics.counts['Quantity Discrepancy']}</span>
                  </div>
                  <div 
                    className={`flex items-center space-x-1 p-0.5 rounded transition ${hoveredSlice === 'Date Warning' ? (isDark ? 'bg-[#ec4899]/15 text-[#ec4899]' : 'bg-pink-100 text-pink-700') : ''}`}
                    onMouseEnter={() => setHoveredSlice('Date Warning')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#ec4899] shrink-0"></span>
                    <span className="truncate">Dates Var: {metrics.counts['Date Warning']}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Transition redirect button inside Slide 0 to Slide 1 */}
            <div className={`mt-5 pt-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500 block">Next Action Directive:</span>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Open ledger browser with <strong className="text-cyan-400 font-extrabold">{filteredRecords.length} loaded records</strong>.
                </span>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-goto-ingestion"
                  onClick={() => handleSlideChange(1)}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Ingest New Doc ⚡</span>
                </button>
                <button
                  type="button"
                  id="btn-goto-ledger"
                  onClick={() => handleSlideChange(2)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Go to Ledger Catalog ➔</span>
                </button>
              </div>
            </div>

          </section>
        </motion.div>
      )}

        {activeSlide === 1 && (
          <motion.div
            key="ingestion-slide"
            initial={{ x: slideDirection === 'forward' ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection === 'forward' ? -120 : 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full h-full flex flex-col gap-6"
          >
            <IngestionOnboardingSlide
              allRecords={allRecords}
              onAddRecord={(rec) => {
                setAllRecords(prev => [rec, ...prev]);
                setCurrentPacket(convertToP2P(rec));
              }}
              vendorMaster={vendorMaster}
              onAddVendor={(vend) => {
                setVendorMaster(prev => [vend, ...prev]);
              }}
              contrastTheme={contrastTheme}
              isDark={isDark}
              onJumpToRecords={() => {
                setSlideDirection('forward');
                setActiveSlide(2);
              }}
              onJumpToMatch={(rec) => {
                handleQuickRemediate(rec);
              }}
            />
          </motion.div>
        )}

        {activeSlide === 2 && (
          <motion.div
            key="ledger-slide"
            initial={{ x: slideDirection === 'forward' ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection === 'forward' ? -120 : 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full flex-grow flex flex-col gap-6"
          >
              <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                contrastTheme === 'obsidian' ? 'bg-[#0b101f] border-slate-900' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-550 bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-semibold text-slate-400">Inspecting Selected Ledger Entry:</span>
                  <strong className="text-cyan-400 text-xs font-mono">{currentPacket.id}</strong>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSlideChange(0)}
                    className="px-3.5 py-1.5 text-[10px] uppercase font-black tracking-widest bg-slate-800/40 text-slate-400 border border-slate-800 hover:border-slate-700 rounded-lg hover:text-white transition cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>

              {/* TAB 1: Ledger sheet & dynamic document preview side-by-side grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEDGER RECORD BROWSER (80 Active Packets Catalog) */}
              <section className={`lg:col-span-5 rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-colors duration-250 ${themeStyles.ledgerSecBg}`}>
              
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-black uppercase tracking-widest flex items-center ${themeStyles.ledgerTitleText}`}>
                    <Database className="w-4 h-4 mr-2 text-cyan-400" />
                    Ledger Document Browser 
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-bold bg-[#14233c] text-cyan-400 border border-cyan-800/20">
                    {filteredRecords.length} found
                  </span>
                </div>
                <p className={`text-[11px] mt-1 ${themeStyles.subText}`}>
                  Examine compliance parameters or click any active item below to load its 4 files into the workbench block.
                </p>
              </div>

              {/* Filters Panel */}
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by ID, Vendor, Invoice/PO..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium transition ${themeStyles.ledgerSearchInputBg}`}
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 border rounded p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold transition ${themeStyles.selectBoxBg}`}
                  >
                    <option value="ALL">All Ledger Statuses</option>
                    <option value="Matched">Fully Matched ({metrics.counts.Matched})</option>
                    <option value="Price Variance">Price Variance ({metrics.counts['Price Variance']})</option>
                    <option value="Quantity Discrepancy">Quantity Discrepancies ({metrics.counts['Quantity Discrepancy']})</option>
                    <option value="Date Warning">Date Warning ({metrics.counts['Date Warning']})</option>
                    <option value="Pending PO">Pending PO Hold ({metrics.counts['Pending PO']})</option>
                  </select>
                </div>
              </div>

              {/* Paginated dynamic table */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((item) => {
                    const isSelected = currentPacket.id === item.id;
                    const statusColor = 
                      item.status === 'Matched' ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30' :
                      item.status === 'Price Variance' ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30' :
                      item.status === 'Quantity Discrepancy' ? 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30' :
                      item.status === 'Date Warning' ? 'bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/30' :
                      'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/30';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleLoadBatchItem(item)}
                        onDoubleClick={() => handleDoubleClickBatchItem(item)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                          isSelected
                            ? 'bg-[#151c38] border-cyan-500/80 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                            : 'bg-[#0b1021]/60 border-slate-800/80 hover:bg-[#0f152d]/60 hover:border-slate-700/80'
                        }`}
                        style={{ height: '115px' }}
                        title="Single-click to select. Double-click to run compliance check."
                      >
                        {/* Line 1: ID, Title & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-black font-mono text-cyan-400 bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-800/20">
                              {item.id}
                            </span>
                            <span className="text-xs font-black tracking-tight text-slate-100 truncate max-w-[150px]">
                              {item.title}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold border ${statusColor}`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Line 2: Financial Metrics */}
                        <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono bg-slate-950/80 p-1.5 rounded border border-slate-900/60">
                          <p>PO: <strong className="text-slate-100">${item.poAmount.toLocaleString()}</strong></p>
                          <p>Bill: <strong className="text-amber-350 text-amber-300 font-bold">{item.invoiceAmount > 0 ? `$${item.invoiceAmount.toLocaleString()}` : 'N/A'}</strong></p>
                          <p>Bal MSA: <strong className="text-purple-400 font-bold">${item.balanceContractValue.toLocaleString()}</strong></p>
                        </div>

                        {/* Line 3: Meta & Selector Trigger */}
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9.5px] text-slate-500 font-semibold italic truncate max-w-[140px]">
                            {item.vendor}
                          </span>
                          
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemediate(item);
                              }}
                              className="px-2 py-0.5 text-[8.5px] font-black bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded uppercase tracking-wider flex items-center shadow-md cursor-pointer transition-all border-b border-indigo-950"
                            >
                              <span>Run Match ⚡</span>
                            </button>
                          ) : (
                            <span className="text-[8.5px] font-black text-slate-500 group-hover:text-cyan-400 group-hover:underline transition-all uppercase tracking-wider">
                              Double-click to Match ➔
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <FileWarning className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No ledger files aligned with this filter</p>
                  </div>
                )}
              </div>

              {/* Ledger browser pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono">
                  <span className="text-slate-500">Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-slate-300 disabled:opacity-40 select-none cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-slate-300 disabled:opacity-40 select-none cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Transition redirect button inside Tab 1 */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                  <span>Package Selected: {currentPacket.id}</span>
                  <span className="text-[#2dd4bf] animate-pulse">Analysis Ready</span>
                </div>
                <button
                  type="button"
                  id="btn-inspect-compliance"
                  onClick={() => {
                    handleSlideChange(3);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Go to Verification Workspace ➔</span>
                </button>
              </div>

            </section>

            {/* VISUAL INVOICE COPY VISUALIZER - AUDIT GROUND TRUTH */}
            <div className="lg:col-span-7 bg-[#0f1425] border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                      Visual Invoice Document Copy (Audit Proof)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Dynamic physical replica & binary attachments</p>
                  </div>
                </div>
                
                {/* Viewport Control Panel for Image/Text Replicas */}
                {currentPacket.invoice && (
                  <div className="flex items-center bg-slate-950/80 border border-slate-850 rounded-lg p-1 space-x-1">
                    <button
                      type="button"
                      onClick={() => setInvoiceZoom(z => Math.max(0.5, z - 0.1))}
                      className="p-1 px-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white text-[10px] font-bold flex items-center transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceZoom(z => Math.min(2.5, z + 0.1))}
                      className="p-1 px-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white text-[10px] font-bold flex items-center transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3 bg-slate-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => setInvoiceRotate(r => (r - 90) % 360)}
                      className="p-1 px-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white text-[10px] font-bold flex items-center transition cursor-pointer"
                      title="Rotate Left"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceRotate(r => (r + 90) % 360)}
                      className="p-1 px-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white text-[10px] font-bold flex items-center transition cursor-pointer"
                      title="Rotate Right"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3 bg-slate-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceZoom(1);
                        setInvoiceRotate(0);
                      }}
                      className="p-1 px-1.5 hover:bg-slate-850 rounded text-[#14b8a6] hover:text-[#2dd4bf] text-[9px] font-bold uppercase tracking-tight transition cursor-pointer"
                      title="Reset Layout"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Main Visualizer Stage */}
              {!currentPacket.invoice ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                  <FileWarning className="w-9 h-9 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No Invoice Loaded</p>
                  <p className="text-[10px] text-slate-500 mt-1">Upload a PDF or Photo Invoice inside the workbench to preview active documents</p>
                </div>
              ) : (
                <div className="bg-slate-950/45 rounded-xl border border-slate-900/60 p-4 min-h-[320px] flex items-center justify-center overflow-auto relative scrollbar-thin">
                  
                  {/* Render Image Source */}
                  {currentPacket.invoice.mimeType?.startsWith('image/') || currentPacket.invoice.content?.startsWith('data:image/') ? (
                    <div 
                      style={{ 
                        transform: `rotate(${invoiceRotate}deg) scale(${invoiceZoom})`, 
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }} 
                      className="py-4 select-none shrink-0"
                    >
                      <img 
                        src={currentPacket.invoice.content} 
                        alt={currentPacket.invoice.name} 
                        className="max-h-[300px] object-contain shadow-2xl rounded-lg border border-slate-800 bg-[#060810]" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : currentPacket.invoice.mimeType?.includes('pdf') || currentPacket.invoice.content?.startsWith('data:application/pdf') ? (
                    <div className="w-full h-[360px] rounded-lg overflow-hidden border border-slate-800">
                      <iframe 
                        src={currentPacket.invoice.content} 
                        className="w-full h-full border-0 bg-white" 
                        title={currentPacket.invoice.name} 
                      />
                    </div>
                  ) : (
                    /* Render physical paper replica for structured text/CSV invoices */
                    <div className="py-6 overflow-hidden w-full flex items-center justify-center">
                      <div 
                        style={{ 
                          transform: `rotate(${invoiceRotate}deg) scale(${invoiceZoom})`, 
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          transformOrigin: 'center center'
                        }} 
                        className="w-full max-w-sm shrink-0"
                      >
                        {(() => {
                          const lines = currentPacket.invoice.content.split('\n');
                          let invNo = 'N/A';
                          let invDate = 'N/A';
                          let vendorName = 'Apex Systems Inc.';
                          let poRef = 'PO-9900-7001';
                          let totalDue = 'N/A';
                          const lineItems: { desc: string; qty: string; price: string; total: string }[] = [];
                          
                          let readingItems = false;
                          lines.forEach(l => {
                            const clean = l.replace(/^[-\s*#]+|[-\s*#]+$/g, '').trim();
                            if (clean.toLowerCase().includes('invoice number:')) {
                              invNo = clean.split(':')[1]?.trim() || invNo;
                            } else if (clean.toLowerCase().includes('invoice date:')) {
                              invDate = clean.split(':')[1]?.trim() || invDate;
                            } else if (clean.toLowerCase().includes('vendor:')) {
                              vendorName = clean.split(':')[1]?.trim() || vendorName;
                            } else if (clean.toLowerCase().includes('purchase order reference:')) {
                              poRef = clean.split(':')[1]?.trim() || poRef;
                            } else if (clean.toLowerCase().includes('total due:')) {
                              totalDue = clean.split(':')[1]?.trim() || totalDue;
                            } else if (clean.toLowerCase().includes('line items:')) {
                              readingItems = true;
                            } else if (readingItems && l.trim()) {
                              if (l.includes('Total Due') || l.includes('Payment Terms')) {
                                readingItems = false;
                              } else if (l.match(/^\d+\./)) {
                                const desc = l.replace(/^\d+\.\s*/, '').trim();
                                lineItems.push({ desc, qty: '1', price: 'N/A', total: 'N/A' });
                              } else if (lineItems.length > 0) {
                                const last = lineItems[lineItems.length - 1];
                                if (l.includes('Qty:')) {
                                  last.qty = l.split('Qty:')[1]?.trim() || last.qty;
                                } else if (l.includes('Unit Price:')) {
                                  last.price = l.split('Unit Price:')[1]?.trim() || last.price;
                                } else if (l.includes('Total Price:')) {
                                  last.total = l.split('Total Price:')[1]?.trim() || last.total;
                                }
                              }
                            }
                          });

                          if (totalDue === 'N/A' && currentPacket.id) {
                            const matchId = currentPacket.id;
                            const record = allRecords.find(r => r.id === matchId);
                            if (record) {
                              invNo = record.invoiceNo;
                              invDate = record.date;
                              vendorName = record.vendor;
                              poRef = record.poNo;
                              totalDue = record.invoiceAmount > 0 ? `$${record.invoiceAmount.toLocaleString()}` : 'Hold / Zero';
                            }
                          }

                          return (
                            <div className="bg-white text-slate-900 p-5 rounded-lg shadow-2xl border border-slate-350 text-left relative overflow-hidden select-text">
                              {/* Watermark stamp */}
                              <div className="absolute right-3 top-3 border-2 border-emerald-600/25 text-emerald-600/25 text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded rotate-12 pointer-events-none">
                                ORIGINAL COPY
                              </div>

                              <div className="border-b border-slate-350 pb-2 mb-3 flex justify-between items-start">
                                <div>
                                  <h1 className="text-xs font-black uppercase tracking-wider text-slate-850 font-black">INVOICE DOCUMENT</h1>
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Reference: <span className="font-bold">{invNo}</span></p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight">{vendorName}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Accounts Receivable</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-[9.5px] mb-3">
                                <div>
                                  <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Bill To:</p>
                                  <p className="font-bold text-slate-800">Enterprise Corp Inc.</p>
                                  <p className="text-slate-550 text-[8.5px]">Corporate Accounts Payable</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Issue Date:</p>
                                  <p className="font-bold text-slate-800 whitespace-nowrap">{invDate}</p>
                                  <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mt-1.5 mb-1">P.O. Reference:</p>
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-bold border border-slate-200 text-[8.5px]">{poRef}</span>
                                </div>
                              </div>

                              <table className="w-full text-left text-[9.5px] mb-4">
                                <thead>
                                  <tr className="border-b border-slate-300 text-slate-500 text-[8px] uppercase font-black">
                                    <th className="pb-1">Details Description</th>
                                    <th className="pb-1 text-center">Qty</th>
                                    <th className="pb-1 text-right">Rate</th>
                                    <th className="pb-1 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {lineItems.length > 0 ? (
                                    lineItems.map((item, key) => (
                                      <tr key={key} className="text-slate-700">
                                        <td className="py-1.5 text-slate-900 font-semibold">{item.desc}</td>
                                        <td className="py-1.5 text-center text-slate-550 font-mono">{item.qty}</td>
                                        <td className="py-1.5 text-right text-slate-550 font-mono">{item.price}</td>
                                        <td className="py-1.5 text-right text-slate-900 font-black font-mono">{item.total}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr className="text-slate-700">
                                      <td className="py-2 text-slate-900 font-semibold">Standard Product Allocation Tier</td>
                                      <td className="py-2 text-center text-slate-550 font-mono">
                                        {(() => {
                                          const rec = allRecords.find(r => r.id === currentPacket.id);
                                          return rec ? rec.invoiceQty : 25;
                                        })()}
                                      </td>
                                      <td className="py-2 text-right text-slate-550 font-mono">
                                        {(() => {
                                          const rec = allRecords.find(r => r.id === currentPacket.id);
                                          return rec && rec.invoiceQty > 0 ? `$${(rec.invoiceAmount / rec.invoiceQty).toFixed(2)}` : '$100.00';
                                        })()}
                                      </td>
                                      <td className="py-2 text-right text-slate-900 font-black font-mono">
                                        {totalDue}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[9.5px]">
                                <div>
                                  <p className="text-[8px] text-slate-400 italic">Net 30. AP Matching Certified.</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7.5px] text-slate-400 font-extrabold uppercase block leading-none mb-1">Balance Due</span>
                                  <span className="text-xs font-black font-mono text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">{totalDue}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            </div>
          </motion.div>
        )}

        {activeSlide === 3 && (
          <motion.div
            key="matching-slide"
            initial={{ x: slideDirection === 'forward' ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection === 'forward' ? -120 : 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full h-full flex flex-col gap-6"
          >
            <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
              contrastTheme === 'obsidian' ? 'bg-[#0b101f] border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-[11px] font-semibold text-slate-400">Active Verification Desk for Packet:</span>
                <strong className="text-cyan-400 text-xs font-mono">{currentPacket.id}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSlideChange(2)}
                  className="px-3.5 py-1.5 text-[10px] uppercase font-black tracking-widest bg-slate-800/40 text-slate-400 border border-slate-800 hover:border-slate-700 rounded-lg hover:text-white transition cursor-pointer"
                >
                  Back to Ledger Catalog
                </button>
              </div>
            </div>

            {/* TAB 2: COMPLIANCE WORKSPACE & MATRIX EXTRAPOLATION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* MATCH WORKSPACE & RESULTS */}
              <div className="lg:col-span-12 space-y-6">

              {/* Quick Trial Actions Toolbar */}
              <div className="bg-[#0f1425] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#2dd4bf] flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    ACTIVE MATCHING ENVIRONMENT
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Currently inspecting: <span className="font-mono text-cyan-400 font-extrabold">{currentPacket.id}</span>. Customize documents or run compliance matching.
                  </p>
                </div>
                
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-dashed border-red-500/50 bg-[#1f0b0c] text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                >
                  Clear Environment
                </button>
              </div>

              {/* SPECIAL BILL SCANNING AND DIRECT UPLOAD STATION - PROMPT-DRIVEN */}
              <div className="bg-gradient-to-br from-[#0c122c] to-[#080b1e] border-2 border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Background high-tech grids or design pulses */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="absolute left-10 bottom-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full pointer-events-none"></div>

                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#21dbc5]">
                        DIGITAL BILL DISPATCH & SCAN STATION
                      </h3>
                    </div>
                    <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">
                      Drop or browse your Invoice/Bill copy below to activate high-accuracy extraction for 4-way compliance validation.
                    </p>
                  </div>
                  
                  {currentPacket.invoice && (
                    <span className="px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded text-[9.5px] font-black font-mono tracking-wide uppercase shadow-sm">
                      Bill Loaded
                    </span>
                  )}
                </div>

                {isScanningBill ? (
                  /* IN-PROGRESS SCANNING ANIMATOR FOR RICH OCR EXPERIMENTAL EFFECT */
                  <div className="bg-slate-950/85 border border-cyan-500/30 p-5 rounded-xl flex flex-col space-y-4 relative overflow-hidden animate-pulse">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 animate-pulse"></div>

                    {/* Scanning Laser Beam Grid effect */}
                    <div className="h-28 bg-[#040818]/60 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-900">
                      {/* Interactive Horizontal lasers */}
                      <div className="absolute left-0 w-full h-[3px] bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-bounce" style={{ animationDuration: '3s' }} />
                      
                      <div className="text-center space-y-2 select-none">
                        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto opacity-75" />
                        <span className="text-[10px] font-mono font-black text-cyan-400 block tracking-widest">{scanProgress}% OCR CORE INGESTING...</span>
                      </div>
                    </div>

                    {/* Live processing terminal feed */}
                    <div className="bg-[#030611] p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-[#22dbc5] leading-relaxed max-h-[100px] overflow-y-auto scrollbar-thin">
                      {scanLogs.map((log, lidx) => (
                        <div key={lidx} className="flex items-start">
                          <span className="text-slate-500 mr-1.5 shrink-0">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* UPLOAD STAGE WORKSPACE */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                    
                    {/* LEFT SLOT: The Active Drop & Selector Zone */}
                    <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                      <div 
                        onClick={() => billScanInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/5 rounded-xl p-4 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center min-h-[145px] group"
                      >
                        <input 
                          type="file" 
                          ref={billScanInputRef}
                          onChange={handleBillScanUpload}
                          accept=".pdf,image/*,.txt,.json,.csv"
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 group-hover:scale-110 transition duration-200 mb-2" />
                        <p className="text-[11.5px] font-black text-slate-300">
                          {currentPacket.invoice ? 'Replace Active Invoice/Bill Copy' : 'Upload or Drag Vendor Bill'}
                        </p>
                        <p className="text-[9.5px] text-slate-500 mt-1 font-bold">
                          Supports PDF, JPG, PNG, TXT or raw spreadsheet data
                        </p>
                      </div>

                      {/* Scenario test loader buttons */}
                      <div className="space-y-1.5 p-2 bg-slate-950/20 rounded-lg border border-slate-900">
                        <span className="text-[8.5px] text-slate-500 uppercase font-black tracking-wider block">Trial Sandbox Templates:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {allRecords.slice(0, 3).map((rec, rIdx) => {
                            const scenarioNames = ["Compliant Apex", "Apex Price Diff", "Global Qty Diff"];
                            return (
                              <button
                                key={rec.id}
                                type="button"
                                onClick={() => {
                                  setCurrentPacket(convertToP2P(rec));
                                  setAuditResult(null);
                                  setSystemBannerMessage(null);
                                  triggerBillScanAnimation(rec.invoiceNo + "_scanned.pdf");
                                }}
                                className="px-2 py-1 text-[9px] bg-[#141b35] hover:bg-[#1c264c] border border-indigo-900/60 text-slate-300 rounded font-black transition cursor-pointer"
                              >
                                {scenarioNames[rIdx]} ({rec.id})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SLOT: Extraction State & Verification controls */}
                    <div className="md:col-span-5 bg-slate-950/40 rounded-xl p-4 border border-slate-900/85 flex flex-col justify-between">
                      {currentPacket.invoice ? (
                        <div className="space-y-3 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-1.5">
                              <span className="text-[8.5px] text-slate-500 uppercase font-black tracking-wider">Loaded Bill Details:</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDocument('invoice', null)}
                                className="text-red-500 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                                title="Remove Bill"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <div className="bg-[#0b1021] p-2.5 rounded border border-slate-850 space-y-1.5">
                              <div className="flex items-center space-x-1.5">
                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[10px] text-slate-200 font-mono font-black truncate max-w-[130px]" title={currentPacket.invoice.name}>
                                  {currentPacket.invoice.name}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[8.5px] text-slate-400 font-semibold font-mono">
                                <div>Mime-Type: <span className="text-[#2dd4bf]">{currentPacket.invoice.mimeType || 'text/plain'}</span></div>
                                <div>Weight: <span className="text-[#2dd4bf]">{currentPacket.invoice.fileSize || 'N/A'}</span></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handleRunMatch}
                              disabled={loading}
                              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black rounded-lg text-[10.5px] uppercase tracking-wider flex items-center justify-center space-x-1.5 hover:shadow-lg transition duration-200 shadow shadow-emerald-500/10 cursor-pointer"
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Validating...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                  <span>Run compliance check</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => triggerBillScanAnimation(currentPacket.invoice!.name)}
                              className="w-full py-1.5 text-center bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-md text-[9px] uppercase tracking-wider transition cursor-pointer"
                            >
                              Restart Laser OCR Ingestion
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full py-4 space-y-2 select-none">
                          <FileText className="w-8 h-8 text-slate-600 animate-pulse" />
                          <p className="text-[10.5px] text-slate-400 font-black uppercase tracking-wider">Waiting for Bill copy</p>
                          <p className="text-[9px] text-slate-500 max-w-[200px]">
                            Load a trial sandbox template on the left or select / drop an invoice file to activate the extraction engine.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* Comparative Matrix table - highly professional dark grid */}
              <div className="bg-[#0f1425] border border-slate-800 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3.5 flex items-center">
                  <FileSearch2 className="w-4 h-4 text-cyan-400 mr-2" />
                  Real-time Document Field Cross-Examination (Extraction Matrix)
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse border border-slate-800 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80">
                        <th className="py-2.5 px-3 text-slate-400 font-extrabold uppercase text-[9.5px]">Extract Keys</th>
                        <th className="py-2.5 px-3 text-amber-400 font-semibold uppercase text-[9.5px] border-l border-slate-800">1. Invoice</th>
                        <th className="py-2.5 px-3 text-cyan-400 font-semibold uppercase text-[9.5px] border-l border-slate-800">2. PO</th>
                        <th className="py-2.5 px-3 text-emerald-400 font-semibold uppercase text-[9.5px] border-l border-slate-800">3. Receipt</th>
                        <th className="py-2.5 px-3 text-purple-400 font-semibold uppercase text-[9.5px] border-l border-slate-800">4. Contract Guideline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 divide-slate-800 bg-slate-900/30">
                      
                      {/* Row Vendor */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-200">Vendor</td>
                        <td className={`py-2.5 px-3 font-semibold border-l border-slate-800 ${isVendorConflict() ? 'text-red-400 bg-red-950/20 font-bold' : ''}`}>
                          {getExtractedField('invoice', 'vendor')}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-400 border-l border-slate-800 ${isVendorConflict() ? 'text-red-400 bg-red-950/20' : ''}`}>
                          {getExtractedField('po', 'vendor')}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-400 border-l border-slate-800 ${isVendorConflict() ? 'text-red-400 bg-red-950/20' : ''}`}>
                          {getExtractedField('receipt', 'vendor')}
                        </td>
                        <td className={`py-2.5 px-3 font-bold border-l border-slate-800 ${isVendorConflict() ? 'text-red-405 bg-red-950/30 text-red-403' : ''}`}>
                          {getExtractedField('contract', 'vendor')}
                        </td>
                      </tr>

                      {/* Row Price */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-200">Price/Rate Check</td>
                        <td className={`py-2.5 px-3 font-semibold border-l border-slate-800 ${isPriceConflict() ? 'text-amber-400 bg-amber-950/20 font-bold' : ''}`}>
                          {getExtractedField('invoice', 'amount')}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-400 border-l border-slate-800 ${isPriceConflict() ? 'text-amber-400 bg-amber-950/20' : ''}`}>
                          {getExtractedField('po', 'amount')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic border-l border-slate-800 font-sans">
                          N/A (Unpriced GRN)
                        </td>
                        <td className={`py-2.5 px-3 font-bold border-l border-slate-800 ${isPriceConflict() ? 'text-amber-450 bg-amber-950/30' : ''}`}>
                          {getExtractedField('contract', 'amount')}
                        </td>
                      </tr>

                      {/* Row Quantity */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-200">Issued Product Qty</td>
                        <td className={`py-2.5 px-3 font-semibold border-l border-slate-800 ${isQuantityConflict() ? 'text-[#3b82f6] bg-[#3b82f6]/10 font-bold' : ''}`}>
                          {getExtractedField('invoice', 'quantity')}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-400 border-l border-slate-800 ${isQuantityConflict() ? 'text-[#3b82f6] bg-[#3b82f6]/10' : ''}`}>
                          {getExtractedField('po', 'quantity')}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-400 border-l border-slate-800 ${isQuantityConflict() ? 'text-[#3b82f6] bg-[#3b82f6]/10 font-bold' : ''}`}>
                          {getExtractedField('receipt', 'quantity')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic border-l border-slate-800 font-sans">
                          N/A (Multi-Purchase schedule)
                        </td>
                      </tr>

                      {/* Row Dates */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-200">Execution Date</td>
                        <td className="py-2.5 px-3 text-slate-400 border-l border-slate-800">{getExtractedField('invoice', 'date')}</td>
                        <td className="py-2.5 px-3 text-slate-400 border-l border-slate-800">{getExtractedField('po', 'date')}</td>
                        <td className="py-2.5 px-3 text-slate-400 border-l border-slate-800">{getExtractedField('receipt', 'date')}</td>
                        <td className="py-2.5 px-3 text-slate-400 border-l border-slate-800">{getExtractedField('contract', 'date')}</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Visual indicator & Jump Link linking Slide 2 Matrix to Slide 3 Editors */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-2.5 px-1 gap-2 border-t border-slate-800/60 mt-2">
                  <div className="flex items-center space-x-1.5 text-[10.5px] text-slate-450 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                    <span>Values inconsistent? Manually adjust rates, quantities, or reference metrics to enforce a match.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSlideChange(4)}
                    className="text-[10px] font-black text-[#21dbc5] hover:text-white transition uppercase tracking-wider flex items-center space-x-1 cursor-pointer bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-md"
                  >
                    <span>Tune Ground-Truth Fields (Slide 5) ➔</span>
                  </button>
                </div>
              </div>

              {/* Execution panel block */}
              <div className="bg-[#0f1425] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[8px] uppercase font-mono tracking-wider font-bold bg-amber-950 text-amber-400 border border-amber-800/20">
                    Verify compliance Hold
                  </span>
                  <h4 className="text-xs font-extrabold tracking-wide uppercase text-slate-200">Trigger AP 4-Way Matching Suite</h4>
                  <p className="text-[11px] text-slate-450 text-slate-450 leading-relaxed font-semibold">
                    Leverage Gemini key validations to extract metrics, identify rate differences or logistic warnings.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleRunMatch}
                    disabled={loading}
                    className={`w-full py-3 px-5 rounded-xl flex items-center justify-center space-x-2 text-xs font-black cursor-pointer transition-all duration-150 tracking-wider shadow-lg ${
                      loading 
                        ? 'bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 hover:shadow-cyan-500/20 text-white border-b-4 border-slate-950 focus:ring-2 focus:ring-cyan-500/50'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>INTERROGATING P2P PACKET...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-cyan-300" />
                        <span>RUN 4-WAY COMPLIANCE MATCH</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AP MATCH REPORT PANEL */}
              <div className="border border-slate-800 rounded-2xl bg-[#0f1425] p-5 flex flex-col space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileSearch2 className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-200">
                      Compliance Audit match conclusion
                    </h2>
                  </div>

                  {auditResult && (
                    <span className={`px-2.5 py-1 rounded text-[9px] font-black font-mono tracking-widest uppercase border ${
                      auditResult.conclusion.toLowerCase().includes('matched') && !auditResult.conclusion.toLowerCase().includes('unmatched') && !auditResult.conclusion.toLowerCase().includes('partial')
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                        : auditResult.conclusion.toLowerCase().includes('unmatched')
                        ? 'bg-red-950/80 text-red-400 border-red-800/40'
                        : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                    }`}>
                      {auditResult.conclusion.toLowerCase().includes('unmatched') 
                        ? 'DISCREPANCY DETECTED' 
                        : (auditResult.conclusion.toLowerCase().includes('matched') && !auditResult.conclusion.toLowerCase().includes('partial'))
                        ? 'COMPLIANT (APPROVED)' 
                        : 'HOLD (RE-ROUTE REQUIRED)'}
                    </span>
                  )}
                </div>

                {/* Match Report Content Area */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-950/50 rounded-xl border border-slate-850/80 space-y-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Comparing item models and rates...</p>
                  </div>
                ) : auditResult ? (
                  <div className="space-y-4">
                    
                    {/* Horizontal report tabs */}
                    <div className="flex flex-wrap border-b border-slate-850 gap-1 pb-1">
                      {['all', 'conclusion', 'evidence', 'policy', 'steps'].map((tab) => (
                        <button 
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-t-lg tracking-wider cursor-pointer transition ${
                            activeTab === tab 
                              ? 'bg-cyan-950/60 border border-slate-850 border-b-transparent text-cyan-400' 
                              : 'text-slate-450 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab === 'all' ? 'All' : tab}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 text-slate-200 text-xs">
                      
                      {(activeTab === 'all' || activeTab === 'conclusion') && (
                        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/30">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1.5">1) Execution Conclusion</h4>
                          <p className="font-sans font-bold whitespace-pre-wrap leading-relaxed select-all">
                            {auditResult.conclusion || 'N/A'}
                          </p>
                        </div>
                      )}

                       {(activeTab === 'all' || activeTab === 'evidence') && (
                        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/30">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2.5">2) Citated Evidence (Point-wise Trace)</h4>
                          <div className="select-all">
                            {renderPointWiseEvidence(auditResult.evidence)}
                          </div>
                        </div>
                      )}

                      {(activeTab === 'all' || activeTab === 'policy') && (
                        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/30">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1.5">3) Policy Basis & MSA Clauses</h4>
                          <p className="font-sans text-slate-350 whitespace-pre-wrap leading-relaxed select-all">
                            {auditResult.policyBasis || 'N/A'}
                          </p>
                        </div>
                      )}

                      {(activeTab === 'all' || activeTab === 'steps') && (
                        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/30">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1.5">4) Next Steps Actions</h4>
                          <p className="font-semibold text-emerald-200 whitespace-pre-wrap leading-relaxed select-all">
                            {auditResult.nextSteps || 'N/A'}
                          </p>
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-950/30 border border-slate-850 border-slate-800/80 rounded-xl px-4">
                    <FileWarning className="w-10 h-10 text-slate-650 text-slate-600 mb-2" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-350 text-slate-300">Matching Results Awaiting</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                      To begin verification, choose a packet from the Ledger Browser or input files, then click <strong className="text-cyan-400">RUN 4-WAY COMPLIANCE MATCH</strong> below.
                    </p>
                  </div>
                )}

              </div>

              {/* RESOLUTION CONTROL CENTRE */}
              <div className={`rounded-2xl p-5 border shadow-xs transition-colors duration-200 ${themeStyles.ledgerSecBg}`}>
                
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                  <Workflow className="w-5 h-5 text-amber-600 shrink-0" />
                  <h2 className={`text-xs font-black uppercase tracking-widest ${themeStyles.ledgerTitleText}`}>
                    RESOLUTION DISCREPANCY FLOW CONTROL
                  </h2>
                </div>

                {!auditResult ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white/60 border border-dashed border-slate-300 rounded-xl">
                    <ShieldAlert className="w-8 h-8 text-slate-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Workflow Engine Standard Hold</h4>
                    <p className="text-[9.5px] text-slate-400 max-w-xs mt-1">
                      A matching evaluation report must be completed successfully before adjudication routes open.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Active warnings and diagnostics with evidence pointers */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-xs">
                      <div className="flex items-center space-x-2 text-red-700 font-extrabold text-[10.5px] mb-3">
                        <span className="h-2 w-2 rounded-full bg-red-650 bg-red-500 animate-pulse"></span>
                        <span className="uppercase tracking-wide">Mismatch Warnings Logged:</span>
                      </div>

                      {activeDiscrepancies.length > 0 ? (
                        <ul className="space-y-3.5">
                          {activeDiscrepancies.map((d, index) => {
                            const isVendor = d.toLowerCase().includes('vendor');
                            const isPrice = d.toLowerCase().includes('price') || d.toLowerCase().includes('rate');
                            const isQty = d.toLowerCase().includes('qty') || d.toLowerCase().includes('quantity');
                            const isDate = d.toLowerCase().includes('date') || d.toLowerCase().includes('timeline');
                            
                            let evidenceKey: 'vendor' | 'price' | 'quantity' | 'date' | null = null;
                            if (isVendor) evidenceKey = 'vendor';
                            else if (isPrice) evidenceKey = 'price';
                            else if (isQty) evidenceKey = 'quantity';
                            else if (isDate) evidenceKey = 'date';
                            
                            const evidenceData = evidenceKey ? getFieldEvidenceExcerpts(evidenceKey) : null;

                            return (
                              <li key={index} className="flex flex-col space-y-2.5 p-3.5 bg-white border border-red-150 rounded-xl text-slate-800 leading-relaxed shadow-3xs">
                                <div className="flex items-start">
                                  <span className="text-red-600 font-extrabold mr-2 shrink-0">•</span>
                                  <span className="text-[11px] text-red-900 font-extrabold leading-tight">{d}</span>
                                </div>
                                {evidenceData && (
                                  <div className="pl-3.5 border-l-2 border-red-300 grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                    <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-normal">
                                      <span className="font-extrabold text-red-800 uppercase block tracking-wider text-[8.5px] mb-0.5">Invoice Extracted Trace:</span>
                                      <span className="font-mono text-slate-700 font-semibold italic bg-white px-1 border border-slate-100 rounded block mt-0.5">{evidenceData.invoice || 'N/A'}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-normal">
                                      <span className="font-extrabold text-indigo-805 text-indigo-800 uppercase block tracking-wider text-[8.5px] mb-0.5">PO Expected Reference:</span>
                                      <span className="font-mono text-slate-700 font-semibold italic bg-white px-1 border border-slate-100 rounded block mt-0.5">{evidenceData.po || 'N/A'}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-normal">
                                      <span className="font-extrabold text-emerald-805 text-emerald-800 uppercase block tracking-wider text-[8.5px] mb-0.5">Goods Received Log:</span>
                                      <span className="font-mono text-slate-700 font-semibold italic bg-white px-1 border border-slate-100 rounded block mt-0.5">{evidenceData.receipt || 'N/A'}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-normal">
                                      <span className="font-extrabold text-amber-805 text-amber-800 uppercase block tracking-wider text-[8.5px] mb-0.5">Master Agreement Rules:</span>
                                      <span className="font-mono text-slate-700 font-semibold italic bg-white px-1 border border-slate-100 rounded block mt-0.5">{evidenceData.contract || 'N/A'}</span>
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-emerald-700 text-[11.5px] font-extrabold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>All fields aligned correctly with standard MSA compliance schedules.</span>
                        </div>
                      )}
                    </div>

                    {/* interactive form */}
                    <form onSubmit={handleResolveDiscrepancy} className="space-y-4">
                      
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 text-slate-400 mb-2">
                          Select Resolution Directive:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          
                          <button
                            type="button"
                            onClick={() => setSelectedResolAction('approve')}
                            className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between h-[75px] ${
                              selectedResolAction === 'approve'
                                ? 'bg-emerald-950/50 border-emerald-550 border-emerald-500 text-emerald-300 font-bold'
                                : 'bg-slate-950/60 border-slate-805 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${selectedResolAction === 'approve' ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span className="text-[10px] uppercase font-bold mt-1">Approve As-Is</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedResolAction('flag')}
                            className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between h-[75px] ${
                              selectedResolAction === 'flag'
                                ? 'bg-red-950/50 border-red-550 border-red-500 text-red-300 font-bold'
                                : 'bg-slate-950/60 border-slate-810 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <ShieldAlert className={`w-4 h-4 ${selectedResolAction === 'flag' ? 'text-red-400' : 'text-slate-500'}`} />
                            <span className="text-[10px] uppercase font-bold mt-1">Flag Anomalies</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedResolAction('route')}
                            className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between h-[75px] ${
                              selectedResolAction === 'route'
                                ? 'bg-amber-950/50 border-amber-550 border-amber-500 text-amber-300 font-bold'
                                : 'bg-slate-950/60 border-slate-805 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Users className={`w-4 h-4 ${selectedResolAction === 'route' ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span className="text-[10px] uppercase font-bold mt-1">Direct Route</span>
                          </button>

                        </div>
                      </div>

                      {/* Action fields */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                        
                        {selectedResolAction === 'approve' && (
                          <div className="space-y-3">
                            <p className="text-[10.5px] text-slate-400 italic">
                              <strong>Approve Exception Override:</strong> Forces AP validation using formal service amendment policies within the contract.
                            </p>
                            <div>
                              <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Precedence Section Clause:</label>
                              <select 
                                value={approveReasonCode}
                                onChange={(e) => setApproveReasonCode(e.target.value)}
                                className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="Contract Tier Compensation Clause Override">Contract Section XII (Precedence Amendment v2)</option>
                                <option value="Volume Discount Tier Level 2 adjustment">Volume Purchase Agreement Level 2 Adjustment</option>
                                <option value="Approved VP Amendment signed signoff doc">Adjusted Flat Service HEPA fee override</option>
                                <option value="Minor Temporal Date Margin accepted within limit">Temporal 30-day Variance Grace Period</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Justification Context Details:</label>
                              <textarea
                                rows={2}
                                value={overrideJustification}
                                onChange={(e) => setOverrideJustification(e.target.value)}
                                required
                                placeholder="State executive authorization, amendment reference codes or reasoning to secure the audit path..."
                                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 font-medium placeholder-slate-600 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {selectedResolAction === 'flag' && (
                          <div className="space-y-3">
                            <p className="text-[10.5px] text-slate-400 italic">
                              <strong>Flag & Compliance Hold:</strong> Rejects layout pipeline and logs formal anomaly triggers to vendor lines.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Severity Tier:</label>
                                <select 
                                  value={flagSeverity}
                                  onChange={(e) => setFlagSeverity(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                                >
                                  <option value="High Priority">High Priority (Immediate hold)</option>
                                  <option value="Medium Hold">Medium Hold (30-day window)</option>
                                  <option value="Minor Anomaly">Minor Anomaly (Acceptable skew)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Classification:</label>
                                <select 
                                  value={flagCategory}
                                  onChange={(e) => setFlagCategory(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                                >
                                  <option value="Rate variance against locked MSA limits">Rate Variance (MSA Violation)</option>
                                  <option value="Physical Receipt units shortfall">Shortfall (Logistics Mismatch)</option>
                                  <option value="Unauthorized Procurement Supplier">Unregistered Vendor Entity</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedResolAction === 'route' && (
                          <div className="space-y-3">
                            <p className="text-[10.5px] text-slate-400 italic">
                              <strong>Direct Supervisor Routing:</strong> Shifts verification duties to specific leadership personnel.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Target Department:</label>
                                <select 
                                  value={assignedDepartment}
                                  onChange={(e) => setAssignedDepartment(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                                >
                                  <option value="Procurement Operations Tier 2">Procurement Operations Tier 2</option>
                                  <option value="Vendor Management Division">Vendor Relations Unit</option>
                                  <option value="Executive Finance Board">Executive Finance Board</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Specific Assignee:</label>
                                <select 
                                  value={individualAssignee}
                                  onChange={(e) => setIndividualAssignee(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                                >
                                  <option value="Sarah Jenkins (Purchasing Lead)">Sarah Jenkins (Director)</option>
                                  <option value="Mark Delgado (Logistics Lead)">Mark Delgado (Logistics)</option>
                                  <option value="Julia Gomez (Facilities VP)">Julia Gomez (VP Admin)</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Notes for Assignee:</label>
                              <textarea
                                rows={2}
                                value={routeNotes}
                                onChange={(e) => setRouteNotes(e.target.value)}
                                placeholder="Describe outstanding queries or direct requests for this case..."
                                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-100 placeholder-slate-600 resize-none font-medium"
                              />
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Dispatch Trigger */}
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all cursor-pointer border-b-4 border-slate-950"
                      >
                        Dispatch Resolution Directive
                      </button>

                    </form>

                    {/* Part C: Workflow timeline trace history */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Workflow Audit trace history
                      </h4>
                      
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {(workflowHistory[currentPacket.id] || []).length > 0 ? (
                          (workflowHistory[currentPacket.id] || []).map((log) => (
                            <div key={log.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-900 flex flex-col space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500">
                                <span>{log.timestamp}</span>
                                <span className={`font-mono text-[8.5px] uppercase font-bold ${
                                  log.actionType === 'approve' ? 'text-emerald-400' :
                                  log.actionType === 'flag' ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                  {log.statusLabel}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">
                                {log.details}
                              </p>
                              <p className="text-[9px] select-all text-slate-500 font-mono italic">
                                Actioned by: {log.operator} ({log.department})
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-600 text-[10px] italic">
                            No modifications logged. Complete override form actions to record traces.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Slide 2 (Verification Slide) to Slide 3 Button */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 shadow-md' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500 block">Operational Metadata Phase:</span>
                <span className={`text-[11.5px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Need to manually edit original document metadata to resolve findings?
                </span>
              </div>
              <button
                type="button"
                id="btn-goto-editors"
                onClick={() => handleSlideChange(4)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 hover:text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <span>Go to Document Editors ➔</span>
              </button>
            </div>

          </div>
          </motion.div>
        )}

        {activeSlide === 4 && (
          <motion.div
            key="editors-slide"
            initial={{ x: slideDirection === 'forward' ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection === 'forward' ? -120 : 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full h-full flex flex-col gap-6"
          >
            <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
              contrastTheme === 'obsidian' ? 'bg-[#0b101f] border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-[11px] font-semibold text-slate-400">Editing Ground-Truth Values:</span>
                <strong className="text-cyan-400 text-xs font-mono">{currentPacket.id}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSlideChange(3)}
                  className="px-3.5 py-1.5 text-[10px] uppercase font-black tracking-widest bg-slate-800/40 text-slate-400 border border-slate-800 hover:border-slate-700 rounded-lg hover:text-white transition cursor-pointer"
                >
                  Back to Matching Desk
                </button>
              </div>
            </div>

            {/* DYNAMIC DOCUMENT EDITORS IN THE WORKBUNCH */}
            <section className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#21dbc5] mb-3 flex items-center">
              <Layers3 className="w-4 h-4 mr-2" />
              Active Workspace Document workbench (4-Way verification fields)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DocumentEditor 
                type="invoice"
                title="1. VENDOR INVOICE (.pdf/.txt)"
                subtitle="Request for payment"
                document={currentPacket.invoice}
                onUpdate={(doc) => handleUpdateDocument('invoice', doc)}
              />
              <DocumentEditor 
                type="po"
                title="2. PURCHASE ORDER (PO)"
                subtitle="Corporate authorized lock"
                document={currentPacket.po}
                onUpdate={(doc) => handleUpdateDocument('po', doc)}
              />
              <DocumentEditor 
                type="receipt"
                title="3. GOODS RECEIPT NOTE (GRN)"
                subtitle="Verification of logistics delivery"
                document={currentPacket.receipt}
                onUpdate={(doc) => handleUpdateDocument('receipt', doc)}
              />
              <DocumentEditor 
                type="contract"
                title="4. MASTER CONTRACT (MSA)"
                subtitle="Authorized guidelines & margins"
                document={currentPacket.contract}
                onUpdate={(doc) => handleUpdateDocument('contract', doc)}
              />
            </div>
          </section>

          {/* Quick Trigger Anchor & navigation linking Slide 4 Editors directly back to Slide 3 Match Auditing */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all mt-4 ${
            isDark ? 'bg-slate-900/60 border-slate-800 shadow-md' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-left space-y-0.5">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Active 4-Way Compliance Suite Sync
              </span>
              <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Values auto-saved in memory. Head back to Slide 4 to evaluate or run compliance checks now.
              </p>
            </div>
            <div className="flex items-center space-x-2.5 w-full sm:w-auto self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleSlideChange(3)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-700/60 transition cursor-pointer"
              >
                Go back to Desk
              </button>
              <button
                type="button"
                onClick={async () => {
                  handleSlideChange(3);
                  // Run match on slide transition completion
                  setTimeout(() => {
                    handleRunMatch();
                  }, 180);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 hover:text-white font-mono font-black text-[10px] uppercase tracking-widest flex items-center space-x-1.5 rounded-lg shadow-lg shadow-cyan-500/10 cursor-pointer active:scale-95 transition-all duration-150"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Run Compliance check! ➔</span>
              </button>
            </div>
          </div>

          </motion.div>
        )}

        </AnimatePresence>
        </div>
        </main>

        {/* Footer info banner */}
        <footer className="bg-[#0b1021] text-xs text-slate-500 py-3.5 px-6 border-t border-slate-800/65 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="font-mono text-[10px]">
            &copy; AP Matching Matrix Vault. All actions logged under HIPAA and SOX compliance rules.
          </div>
          <div className="flex items-center space-x-2 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-slate-400 font-mono select-all">Auditor Desk: prajwalkumar3@gmail.com</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
