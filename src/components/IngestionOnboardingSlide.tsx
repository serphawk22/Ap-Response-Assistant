import React, { useState, useMemo } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Building, 
  Briefcase, 
  Search, 
  Plus, 
  ArrowRight, 
  Lock, 
  User, 
  MapPin, 
  Mail, 
  RefreshCw, 
  ShieldCheck,
  Check,
  AlertCircle,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { BatchItem } from '../recordsGenerator';
import { VendorMasterItem } from '../types';

interface IngestionOnboardingSlideProps {
  allRecords: BatchItem[];
  onAddRecord: (newRecord: BatchItem) => void;
  vendorMaster: VendorMasterItem[];
  onAddVendor: (newVendor: VendorMasterItem) => void;
  contrastTheme: 'obsidian' | 'ivory';
  isDark: boolean;
  onJumpToRecords: () => void;
  onJumpToMatch: (item: BatchItem) => void;
}

export default function IngestionOnboardingSlide({
  allRecords,
  onAddRecord,
  vendorMaster,
  onAddVendor,
  contrastTheme,
  isDark,
  onJumpToRecords,
  onJumpToMatch
}: IngestionOnboardingSlideProps) {
  // Document Upload states
  const [docContract, setDocContract] = useState<{ name: string; content: string; uploaded: boolean } | null>(null);
  const [docPO, setDocPO] = useState<{ name: string; content: string; uploaded: boolean } | null>(null);
  const [docGRN, setDocGRN] = useState<{ name: string; content: string; uploaded: boolean } | null>(null);
  const [docInvoice, setDocInvoice] = useState<{ name: string; content: string; uploaded: boolean } | null>(null);

  // Form input fields for dynamic mapping/override
  const [vendorName, setVendorName] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [lockedRate, setLockedRate] = useState('120');
  const [poNo, setPoNo] = useState('');
  const [poQty, setPoQty] = useState('100');
  const [poRate, setPoRate] = useState('120');
  const [grnNo, setGrnNo] = useState('');
  const [grnQty, setGrnQty] = useState('100');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceQty, setInvoiceQty] = useState('100');
  const [invoiceRate, setInvoiceRate] = useState('120');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  // Vendor Onboarding Contact Info
  const [contactName, setContactName] = useState('John Doe');
  const [contactEmail, setContactEmail] = useState('procurement@vendor.com');
  const [vendorAddress, setVendorAddress] = useState('100 Technology Row, Suite 400');

  // Loading/Processing states for Ingestion Engine
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [newlyIngestedItem, setNewlyIngestedItem] = useState<BatchItem | null>(null);

  // Search & Filters for Vendor Master Validation Panel (Requirement 3)
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorMasterItem | null>(null);

  // Color classes helper
  const themeCardBg = isDark ? 'bg-[#0f1425] border-slate-800' : 'bg-white border-slate-200';
  const themeInputBg = isDark ? 'bg-slate-950/60 border-slate-800 focus:border-cyan-500 text-slate-100' : 'bg-slate-50 border-slate-200 focus:border-cyan-600 text-slate-900';
  const themeText = isDark ? 'text-slate-100' : 'text-slate-900';
  const themeSubtext = isDark ? 'text-slate-400' : 'text-slate-600';

  // Demo scenarios to quickly fill structure
  const demoScenarios = [
    {
      title: "Clean Match (New Vendor)",
      vendor: "Vortex Solar Tech",
      contract: "MSA-2026-V88",
      lockedRate: "145",
      po: "PO-9900-V88",
      poQty: "150",
      poRate: "145",
      grn: "GRN-8800-V88",
      grnQty: "150",
      invoice: "INV-2026-V88",
      invoiceQty: "150",
      invoiceRate: "145",
      terms: "Net 45",
      contact: "Marcus Aurelius (Director)",
      email: "marcus@vortexsolar.com",
      address: "12 Stellar Blvd, Austin TX",
      contractName: "vortex_solar_agreement_2026.pdf",
      poName: "po_10203_solar.pdf",
      grnName: "grn_93810_warehouse.pdf",
      invName: "invoice_948112_signed.pdf"
    },
    {
      title: "Price Variance (Onboarded Vendor)",
      vendor: "CleanPro Facilities Services", // Existing on original pool
      contract: "MSA-2025-12",
      lockedRate: "90",
      po: "PO-9900-C56",
      poQty: "80",
      poRate: "95", // Variance in PO rate setting
      grn: "GRN-8800-C56",
      grnQty: "80",
      invoice: "INV-2026-C56",
      invoiceQty: "80",
      invoiceRate: "95", // Variance matches PO, but exceeds locked agreement limit of $90!
      terms: "Net 30",
      contact: "Sarah Connor (Logistics Lead)",
      email: "sconnor@cleanpro.com",
      address: "99 Sanitation Lane, Chicago IL",
      contractName: "cleanpro_master_agreement_v2.pdf",
      poName: "po_cleanup_chicago.pdf",
      grnName: "grn_cleaning_services.pdf",
      invName: "invoice_cleanpro_948.pdf"
    },
    {
      title: "Quantity Discrepancy (New Supplier)",
      vendor: "Apex Dynamics Corp",
      contract: "MSA-2026-A12",
      lockedRate: "210",
      po: "PO-9900-A12",
      poQty: "200",
      poRate: "210",
      grn: "GRN-8800-A12",
      grnQty: "185", // Logistic verified only 185 physical units received!
      invoice: "INV-2026-A12",
      invoiceQty: "200", // Vendor bills full order of 200 units! Invoiced quantities mismatch GRN!
      terms: "Net 30",
      contact: "Diana Prince (Accounts Payable)",
      email: "diana@apexdynamics.org",
      address: "24 Industrial Plaza, Boston MA",
      contractName: "apex_dynamics_msa_signed.pdf",
      poName: "po_9431_dynamics_boston.pdf",
      grnName: "grn_9213_boston_docks.pdf",
      invName: "invoice_dynamic_941.pdf"
    }
  ];

  const applyScenario = (s: typeof demoScenarios[0]) => {
    setVendorName(s.vendor);
    setContractNo(s.contract);
    setLockedRate(s.lockedRate);
    setPoNo(s.po);
    setPoQty(s.poQty);
    setPoRate(s.poRate);
    setGrnNo(s.grn);
    setGrnQty(s.grnQty);
    setInvoiceNo(s.invoice);
    setInvoiceQty(s.invoiceQty);
    setInvoiceRate(s.invoiceRate);
    setPaymentTerms(s.terms);
    setContactName(s.contact);
    setContactEmail(s.email);
    setVendorAddress(s.address);

    setDocContract({ name: s.contractName, content: `MASTER CONTRACT INTEGRITY: ${s.vendor} lock at $${s.lockedRate}/unit via ID ${s.contract}`, uploaded: true });
    setDocPO({ name: s.poName, content: `PURCHASE ORDER AUTHORIZATION: No ${s.po} under ${s.vendor} buying ${s.poQty} units.`, uploaded: true });
    setDocGRN({ name: s.grnName, content: `WAREHOUSE RECEIVE SLIP: GRN No ${s.grn}, verified delivery counts: ${s.grnQty} units.`, uploaded: true });
    setDocInvoice({ name: s.invName, content: `BILL INVOICE: No ${s.invoice}, requested $${(Number(s.invoiceQty) * Number(s.invoiceRate)).toLocaleString()} for ${s.invoiceQty} units.`, uploaded: true });

    setProcessingLogs([]);
    setNewlyIngestedItem(null);
  };

  const handleUploadClick = (docType: 'contract' | 'po' | 'grn' | 'invoice') => {
    // Simulate interactive micro document ingestion with specific placeholder formats
    const randomId = Math.floor(Math.random() * 100000);
    const mockDetails: Record<string, { fName: string; text: string }> = {
      contract: { fName: `con_${randomId}_msa.pdf`, text: `Contract terms signed off, locking standards pricing schedules.` },
      po: { fName: `po_${randomId}_auth.pdf`, text: `Corporate authorized buyer requisition lock issued.` },
      grn: { fName: `grn_${randomId}_logistics.txt`, text: `Warehouse logistics docket physical confirmation counts.` },
      invoice: { fName: `inv_${randomId}_claim.txt`, text: `Vendor financial claim and payment request billing.` }
    };

    const target = mockDetails[docType];
    if (docType === 'contract') setDocContract({ name: target.fName, content: target.text, uploaded: true });
    if (docType === 'po') setDocPO({ name: target.fName, content: target.text, uploaded: true });
    if (docType === 'grn') setDocGRN({ name: target.fName, content: target.text, uploaded: true });
    if (docType === 'invoice') setDocInvoice({ name: target.fName, content: target.text, uploaded: true });
  };

  const clearAllUploaded = () => {
    setDocContract(null);
    setDocPO(null);
    setDocGRN(null);
    setDocInvoice(null);
    setNewlyIngestedItem(null);
    setProcessingLogs([]);
  };

  const handleRunIngestionAndValidation = () => {
    if (!vendorName || !contractNo || !poNo || !grnNo || !invoiceNo) {
      alert("Missing key metadata names! Please fill document descriptors or choose one of our high-contrast quick scenario templates.");
      return;
    }

    setIsProcessing(true);
    setProcessingLogs(["[1/5] Ingesting binary files stream, generating OCR document parser tokens..."]);
    
    setTimeout(() => {
      setProcessingLogs(prev => [...prev, `[2/5] Parsed Contract "${contractNo}" — Verifying pricing rates and compliance controls...`]);
    }, 400);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, `[3/5] Parsed PO "${poNo}" and mapped GRN "${grnNo}" — Compiling quantity logs...`]);
    }, 800);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, `[4/5] Matched Invoice "${invoiceNo}" quantities (${invoiceQty}) against logged GRN received (${grnQty})...`]);
    }, 1200);

    setTimeout(() => {
      // Create new vendor if it does not exist
      const existingVendor = vendorMaster.find(v => v.name.toLowerCase() === vendorName.toLowerCase());
      const cRate = Number(lockedRate) || 120;
      const cValue = (Number(poQty) || 100) * cRate * 12;

      if (!existingVendor) {
        const newVendor: VendorMasterItem = {
          id: `VR-${String(vendorMaster.length + 1).padStart(3, '0')}`,
          name: vendorName,
          contractNo: contractNo,
          contractValue: cValue,
          lockedPricePerUnit: cRate,
          paymentTerms: paymentTerms || 'Net 30',
          status: 'Active',
          contactName: contactName || 'John Doe',
          contactEmail: contactEmail || 'ap@vendor.com',
          address: vendorAddress || 'Corporate Way',
          totalOrders: 1
        };
        onAddVendor(newVendor);
        setProcessingLogs(prev => [...prev, `[NEW VENDOR CREATED] Loaded unique profile in Vendor Master: ${vendorName}`]);
      } else {
        setProcessingLogs(prev => [...prev, `[SUPPLIER VERIFIED] Vendor "${vendorName}" matches active registered entities.`]);
      }

      // Deduce the compliance status code
      let complianceStatus: 'Matched' | 'Price Variance' | 'Quantity Discrepancy' | 'Date Warning' = 'Matched';
      const numPoRate = Number(poRate);
      const numInvRate = Number(invoiceRate);
      const numLockedRate = Number(lockedRate);
      const numPoQty = Number(poQty);
      const numGrnQty = Number(grnQty);
      const numInvQty = Number(invoiceQty);

      if (numInvRate > numLockedRate || numPoRate > numLockedRate || numInvRate !== numPoRate) {
        complianceStatus = 'Price Variance';
      } else if (numInvQty !== numGrnQty || numInvQty !== numPoQty) {
        complianceStatus = 'Quantity Discrepancy';
      }

      // Format clean dates
      const recordDate = new Date().toISOString().split('T')[0];

      // Insert new record
      const newRec: BatchItem = {
        id: `P2P-2026-B${String(allRecords.length + 1).padStart(3, '0')}`,
        title: `${vendorName.split(' ')[0]} Ingested #${1000 + allRecords.length + 1}`,
        vendor: vendorName,
        invoiceNo: invoiceNo,
        poNo: poNo,
        receiptNo: grnNo,
        contractNo: contractNo,
        status: complianceStatus,
        invoiceAmount: numInvRate * numInvQty,
        poAmount: numPoRate * numPoQty,
        balanceContractValue: cValue,
        invoiceQty: numInvQty,
        receiptQty: numGrnQty,
        date: recordDate,
        description: `Ingested dynamic P2P document bundle. Contract lock rate: $${cRate}. Billed rate: $${numInvRate}.`
      };

      onAddRecord(newRec);
      setNewlyIngestedItem(newRec);
      setProcessingLogs(prev => [...prev, `[5/5] Ingest Completed! Saved record ${newRec.id} to system pool. Matching logic calculated.`]);
      setIsProcessing(false);
    }, 1800);
  };

  // Filter vendor list for search
  const filteredVendors = useMemo(() => {
    return vendorMaster.filter(v => 
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.contractNo.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.id.toLowerCase().includes(vendorSearch.toLowerCase())
    );
  }, [vendorMaster, vendorSearch]);

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${themeCardBg}`}>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#21dbc5] flex items-center space-x-1.5">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <span>Document Ingestion, Entity Auto-Generation & Vendor Master Suite</span>
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-1">
            Accepts new supplier packages. Validates master agreements, automatically structures purchase orders & receiving logs, maps them dynamically, and commits them to our vetted Vendor registry.
          </p>
        </div>

        {/* DEMO SELECTOR PRESETS */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9.5px] font-black uppercase text-slate-500 mr-1.5">Preset Scenarios:</span>
          {demoScenarios.map((s, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyScenario(s)}
              className="px-2.5 py-1 text-[9px] font-black border border-slate-800 bg-[#0f1425]/80 hover:bg-[#1a233b] hover:border-cyan-500/50 text-cyan-300 rounded-md transition duration-150 cursor-pointer"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: ACTIVE MULTI-DOC UPLOAD STRUCTURE */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className={`p-5 rounded-xl border flex flex-col justify-between h-full ${themeCardBg}`}>
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-cyan-400" />
                  1. Multi-Document Secure Upload Dropzone
                </h3>
                <button
                  type="button"
                  onClick={clearAllUploaded}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 px-2 py-0.5 border border-red-950 bg-red-950/20 rounded transition"
                >
                  Reset Documents
                </button>
              </div>

              {/* 4 UPLOAD BINS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. CONTRACT MSA CONTAINER */}
                <div 
                  onClick={() => handleUploadClick('contract')}
                  className={`p-4 rounded-xl border border-dashed text-left transition-all cursor-pointer relative ${
                    docContract?.uploaded 
                      ? 'bg-emerald-950/20 border-emerald-500/60' 
                      : 'bg-[#030712]/50 border-slate-800 hover:border-cyan-500/50 hover:bg-[#070c1a]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Doc A: Master Services Agreement</p>
                      <h4 className="text-xs font-semibold">{docContract?.name || "UPLOAD SUPPLIER MSA CONTRACT"}</h4>
                      <p className="text-[10px] text-slate-500">Locks pricing tiers & locked compliance rate variables</p>
                    </div>
                    {docContract?.uploaded ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                  </div>
                  {docContract?.uploaded && (
                    <div className="mt-2 text-[9.5px] text-emerald-200/80 bg-emerald-950/40 p-1 rounded font-mono truncate">
                      {docContract.content}
                    </div>
                  )}
                </div>

                {/* 2. PURCHASE ORDER */}
                <div 
                  onClick={() => handleUploadClick('po')}
                  className={`p-4 rounded-xl border border-dashed text-left transition-all cursor-pointer relative ${
                    docPO?.uploaded 
                      ? 'bg-emerald-950/20 border-emerald-500/60' 
                      : 'bg-[#030712]/50 border-slate-800 hover:border-cyan-500/50 hover:bg-[#070c1a]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Doc B: Purchase Order (PO)</p>
                      <h4 className="text-xs font-semibold">{docPO?.name || "INGEST CORPORATE PO"}</h4>
                      <p className="text-[10px] text-slate-500">Authorized corporate locked quantity and rates</p>
                    </div>
                    {docPO?.uploaded ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                  </div>
                  {docPO?.uploaded && (
                    <div className="mt-2 text-[9.5px] text-emerald-200/80 bg-emerald-950/40 p-1 rounded font-mono truncate">
                      {docPO.content}
                    </div>
                  )}
                </div>

                {/* 3. GOODS RECEIVED NOTE */}
                <div 
                  onClick={() => handleUploadClick('grn')}
                  className={`p-4 rounded-xl border border-dashed text-left transition-all cursor-pointer relative ${
                    docGRN?.uploaded 
                      ? 'bg-emerald-950/20 border-emerald-500/60' 
                      : 'bg-[#030712]/50 border-slate-800 hover:border-cyan-500/50 hover:bg-[#070c1a]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Doc C: Goods Received Note (GRN)</p>
                      <h4 className="text-xs font-semibold">{docGRN?.name || "UPLOAD LOGISTIC GRN DOCKET"}</h4>
                      <p className="text-[10px] text-slate-500">Warehouse physical receipts audit trail</p>
                    </div>
                    {docGRN?.uploaded ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                  </div>
                  {docGRN?.uploaded && (
                    <div className="mt-2 text-[9.5px] text-emerald-200/80 bg-emerald-950/40 p-1 rounded font-mono truncate">
                      {docGRN.content}
                    </div>
                  )}
                </div>

                {/* 4. VENDOR BILL / INVOICE */}
                <div 
                  onClick={() => handleUploadClick('invoice')}
                  className={`p-4 rounded-xl border border-dashed text-left transition-all cursor-pointer relative ${
                    docInvoice?.uploaded 
                      ? 'bg-emerald-950/20 border-emerald-500/60' 
                      : 'bg-[#030712]/50 border-slate-800 hover:border-cyan-500/50 hover:bg-[#070c1a]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Doc D: Billed Vendor Invoice</p>
                      <h4 className="text-xs font-semibold">{docInvoice?.name || "INGEST SUPPLIER INVOICE"}</h4>
                      <p className="text-[10px] text-slate-500">The raw financial claim submitted for payouts</p>
                    </div>
                    {docInvoice?.uploaded ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                  </div>
                  {docInvoice?.uploaded && (
                    <div className="mt-2 text-[9.5px] text-emerald-200/80 bg-emerald-950/40 p-1 rounded font-mono truncate">
                      {docInvoice.content}
                    </div>
                  )}
                </div>
              </div>

              {/* DOCUMENT PARSED DATA METADATA VALIDATOR */}
              <div className="mt-6 border border-slate-800/80 rounded-xl p-4 bg-slate-950/40 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                  Extract & Validate Active Ingestion Schema
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vendor Onboarding details */}
                  <div className="md:col-span-3 border-b border-slate-800pb-2">
                    <span className="text-[9.5px] font-black uppercase text-cyan-500">Supplier Onboarding Details</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400">Vendor Corporate Name</label>
                    <input
                      type="text"
                      className={`w-full px-2 py-1.5 rounded text-xs leading-none font-medium outline-none transition ${themeInputBg}`}
                      placeholder="e.g. Acme Industries Ltd."
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400">Contract Reference No.</label>
                    <input
                      type="text"
                      className={`w-full px-2 py-1.5 rounded text-xs leading-none font-medium outline-none transition ${themeInputBg}`}
                      placeholder="e.g. MSA-2026-X11"
                      value={contractNo}
                      onChange={(e) => setContractNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400">Locked MSA rate ($/unit)</label>
                    <input
                      type="number"
                      className={`w-full px-2 py-1.5 rounded text-xs leading-none font-medium outline-none transition ${themeInputBg}`}
                      placeholder="e.g. 150"
                      value={lockedRate}
                      onChange={(e) => setLockedRate(e.target.value)}
                    />
                  </div>

                  {/* Operational values */}
                  <div className="md:col-span-3 border-b border-slate-800 pb-1 pt-2">
                    <span className="text-[9.5px] font-black uppercase text-cyan-500">Structured Documents (PO, GRN, Bill) Fields</span>
                  </div>

                  <div className="space-y-2 border border-slate-800 p-2.5 rounded bg-slate-900/30">
                    <span className="text-[9.5px] font-black text-[#21dbc5] uppercase block">A) Purchase Order (PO):</span>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">PO Number ID</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                        placeholder="PO-9900-..."
                        value={poNo}
                        onChange={(e) => setPoNo(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9.5px] text-slate-400">PO Qty</label>
                        <input
                          type="number"
                          className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                          value={poQty}
                          onChange={(e) => setPoQty(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400">PO Rate ($)</label>
                        <input
                          type="number"
                          className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                          value={poRate}
                          onChange={(e) => setPoRate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border border-slate-800 p-2.5 rounded bg-slate-900/30">
                    <span className="text-[9.5px] font-black text-[#21dbc5] uppercase block">B) Warehouse (GRN):</span>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">GRN No.</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                        placeholder="GRN-8800-..."
                        value={grnNo}
                        onChange={(e) => setGrnNo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-slate-400">GRN Received Qty</label>
                      <input
                        type="number"
                        className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                        value={grnQty}
                        onChange={(e) => setGrnQty(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border border-slate-800 p-2.5 rounded bg-slate-900/30">
                    <span className="text-[9.5px] font-black text-[#21dbc5] uppercase block">C) Invoiced Bill:</span>
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-slate-400 font-mono">Invoice Invoice No.</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                        placeholder="INV-2026-..."
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9.5px] text-slate-400">Billed Qty</label>
                        <input
                          type="number"
                          className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                          value={invoiceQty}
                          onChange={(e) => setInvoiceQty(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-400">Billed Rate ($)</label>
                        <input
                          type="number"
                          className={`w-full px-2 py-1 text-xs font-mono rounded ${themeInputBg}`}
                          value={invoiceRate}
                          onChange={(e) => setInvoiceRate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vendor contact details */}
                  <div className="md:col-span-3 border-t border-slate-800/85 pt-3 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">Supplier Key Contact</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs rounded ${themeInputBg}`}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">Corporate Email</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs rounded ${themeInputBg}`}
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">Supplier Address</label>
                      <input
                        type="text"
                        className={`w-full px-2 py-1 text-xs rounded ${themeInputBg}`}
                        value={vendorAddress}
                        onChange={(e) => setVendorAddress(e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ACTION & PROCESSING TERMINAL FEEDBACK */}
            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={handleRunIngestionAndValidation}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-[#21dbc5] to-[#12a1ef] hover:from-[#1bc5b1] hover:to-[#0f8ec4] text-slate-950 hover:text-white font-mono font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 rounded-xl transition duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>EXTRACTING OCR TOKENS & MAPPING P2P ENTITIES...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>VALIDATE & INGEST P2P PACKET ⚡</span>
                  </>
                )}
              </button>

              {/* LIVE PROCESSING LOG FEED */}
              {processingLogs.length > 0 && (
                <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 space-y-1.5 text-left font-mono text-[10px] text-slate-300">
                  <p className="text-[9.5px] uppercase font-bold text-cyan-400 border-b border-slate-900 pb-1 mb-1">
                    AP Verification Engine Stream Analytics:
                  </p>
                  {processingLogs.map((log, idx) => (
                    <p key={idx} className={log.includes('NEW VENDOR') || log.includes('Ingest Completed') ? 'text-emerald-400 font-black' : 'text-slate-300'}>
                      ➜ {log}
                    </p>
                  ))}
                </div>
              )}

              {/* INGESTION CONFIRMATION & NAVIGATION CONNECTORS */}
              {newlyIngestedItem && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                        Ingestion Schema Fully Mapped Successfully
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Associated documents validated, corresponding PO structure compiled & added inside ledger records pool.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0b1021] p-3 rounded-lg border border-slate-900 grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <p>Generated Packet ID: <strong className="text-cyan-400 font-extrabold">{newlyIngestedItem.id}</strong></p>
                    <p>Assigned Supplier: <strong className="text-[#2dd4bf]">{newlyIngestedItem.vendor}</strong></p>
                    <p>Bill Invoice No.: <strong className="text-slate-300">{newlyIngestedItem.invoiceNo}</strong></p>
                    <p>MAPPED PO Number: <strong className="text-slate-300">{newlyIngestedItem.poNo}</strong></p>
                    <p>Computed AP Delta: <strong className={newlyIngestedItem.status === 'Matched' ? 'text-emerald-400' : 'text-amber-400'}>{newlyIngestedItem.status}</strong></p>
                    <p>Invoiced Claim: <strong className="text-slate-200">${newlyIngestedItem.invoiceAmount.toLocaleString()}</strong></p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onJumpToRecords}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[10.5px] font-black uppercase tracking-wider cursor-pointer text-center"
                    >
                      View in Ledger Pool (Slide 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => onJumpToMatch(newlyIngestedItem)}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:text-white font-mono font-black uppercase tracking-wider rounded-lg text-[10.5px] cursor-pointer text-center flex items-center justify-center gap-1 hover:shadow-lg active:scale-95 transition-all"
                    >
                      <span>COMPLIANCE MATCH WORKSPACE (Slide 4) ⚡</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: VENDOR MASTER DETAILS (Requirement 3) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className={`p-5 rounded-xl border h-full flex flex-col justify-between ${themeCardBg}`}>
            
            <div className="space-y-4">
              {/* Header registry block */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center">
                    <Building className="w-4 h-4 mr-1.5 text-cyan-400 animate-pulse" />
                    2. Vendor Master Details Registry
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Vetted database of corporations, lock-prices & active compliance terms.</p>
                </div>
                <span className="px-2 py-0.5 text-[8.5px] font-bold font-mono text-cyan-400 bg-cyan-950/40 rounded border border-cyan-800/10">
                  {vendorMaster.length} SUPPLIERS
                </span>
              </div>

              {/* SEARCH & FILTERS IN REGISTRY */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Vendor Register by name, MSA or code..."
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none transition ${themeInputBg}`}
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
              </div>

              {/* SUPPLIER DATA GRID LIST */}
              <div className="overflow-y-auto max-h-[580px] pr-1.5 space-y-2.5 custom-scrollbar">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor) => {
                    const isSelected = selectedVendorDetail?.id === vendor.id;
                    const statusColors = {
                      Active: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60',
                      'Under Audit': 'bg-amber-950/40 text-amber-400 border-amber-900/60',
                      Suspended: 'bg-red-950/40 text-red-400 border-red-900/60'
                    };

                    return (
                      <div
                        key={vendor.id}
                        onClick={() => setSelectedVendorDetail(isSelected ? null : vendor)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'bg-[#151d38] border-cyan-500 shadow-md ring-1 ring-cyan-500/20' 
                            : 'bg-slate-950/30 border-slate-900 hover:bg-[#0c1223]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 text-[8px] font-bold font-mono bg-slate-900 text-cyan-400 rounded border border-slate-800">
                              {vendor.id}
                            </span>
                            <h4 className="text-[12px] font-black text-slate-200 tracking-tight">{vendor.name}</h4>
                          </div>
                          <span className={`px-2 py-0.5 text-[7px] uppercase tracking-wider font-bold rounded border ${statusColors[vendor.status]}`}>
                            {vendor.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-3 text-[10px] font-mono text-slate-400">
                          <p>Contract Ref: <span className="text-slate-200 font-semibold">{vendor.contractNo}</span></p>
                          <p>Locked rate: <span className="text-purple-400 font-bold">${vendor.lockedPricePerUnit}/unit</span></p>
                          <p>Total Orders: <span className="text-slate-200">{vendor.totalOrders || '1'}</span></p>
                          <p>Payment terms: <span className="text-amber-300 font-semibold">{vendor.paymentTerms}</span></p>
                        </div>

                        {/* EXPANDED SCRIPT ACCORDION */}
                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                              <p className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-cyan-400" />
                                <span>AP Lead: <strong className="text-slate-200">{vendor.contactName}</strong></span>
                              </p>
                              <p className="flex items-center space-x-1">
                                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="truncate">Email: <strong className="text-slate-200 hover:underline">{vendor.contactEmail}</strong></span>
                              </p>
                              <p className="flex items-center space-x-1 md:col-span-2">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">HQ Address: <strong className="text-slate-200">{vendor.address}</strong></span>
                              </p>
                            </div>

                            <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-1 text-[10px]">
                              <span className="text-[9.5px] uppercase font-bold text-[#2dd4bf] block mb-1">Contract Pricing Constraints Audit:</span>
                              <p className="text-slate-300">✓ Unit price verified: Checked against locked rate <strong className="text-purple-400">${vendor.lockedPricePerUnit}.</strong></p>
                              <p className="text-slate-400">Locked agreement is authorized. Direct compliance limits are active. All four-way transactions must respect this limit.</p>
                            </div>
                          </div>
                        )}
                        
                        {!isSelected && (
                          <div className="text-[8px] text-slate-500 uppercase font-bold text-right tracking-wider mt-2 group-hover:text-cyan-400 transition-colors">
                            Click to expand details
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 border border-dashed border-slate-850 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-slate-655 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400 uppercase font-mono">No supply registry matches.</p>
                    <p className="text-[9.5px] text-slate-500 mt-1">Refine your query filters of the Supplier Register.</p>
                  </div>
                )}
              </div>

            </div>

            {/* QUICK INFRASTRUCTURE STATS AT THE FOOTER */}
            <div className="mt-4 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60 text-[10.5px] text-slate-400 flex items-center space-x-2.5 text-left leading-relaxed">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <p>
                Compliance Checkpoint: Discrepancies and variances will flag on Slide 4 (Matching Desk). Vetted items require signature of approved officers.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
