import React, { useState, useRef } from 'react';
import { FileText, Upload, Edit, X, RefreshCw, ClipboardPaste } from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentEditorProps {
  type: 'invoice' | 'po' | 'receipt' | 'contract';
  title: string;
  subtitle: string;
  document: DocumentFile | null;
  onUpdate: (doc: DocumentFile | null) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  type,
  title,
  subtitle,
  document,
  onUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTypeColor = () => {
    switch (type) {
      case 'invoice': 
        return { 
          border: 'border-amber-500/40 focus-within:border-amber-400 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)]', 
          bg: 'bg-amber-950/20', 
          text: 'text-amber-400', 
          banner: 'bg-amber-950/40 border-b border-amber-800/40',
          accent: 'amber'
        };
      case 'po': 
        return { 
          border: 'border-cyan-500/40 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)]', 
          bg: 'bg-cyan-950/20', 
          text: 'text-cyan-400', 
          banner: 'bg-cyan-950/40 border-b border-cyan-800/40',
          accent: 'cyan'
        };
      case 'receipt': 
        return { 
          border: 'border-emerald-500/40 focus-within:border-emerald-400 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]', 
          bg: 'bg-emerald-950/20', 
          text: 'text-emerald-400', 
          banner: 'bg-emerald-950/40 border-b border-emerald-800/40',
          accent: 'emerald'
        };
      case 'contract': 
        return { 
          border: 'border-purple-500/40 focus-within:border-purple-400 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)]', 
          bg: 'bg-purple-950/20', 
          text: 'text-purple-400', 
          banner: 'bg-purple-950/40 border-b border-purple-800/40',
          accent: 'purple'
        };
    }
  };

  const colors = getTypeColor();

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    
    reader.onload = (e) => {
      const resultValue = e.target?.result as string;
      
      onUpdate({
        name: file.name,
        type: type,
        mimeType: file.type || (isImage ? 'image/png' : isPdf ? 'application/pdf' : 'text/plain'),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        content: resultValue
      });
      setIsEditing(false);
    };

    if (isImage || isPdf) {
      reader.readAsDataURL(file); // Reads as base64 data URL
    } else {
      reader.readAsText(file); // Reads as plain text
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const startManualEdit = () => {
    setEditText(document ? document.content : '');
    setIsEditing(true);
  };

  const saveManualEdit = () => {
    onUpdate({
      name: document?.name || `manual-input-${type}.txt`,
      type: type,
      mimeType: 'text/plain',
      fileSize: `${(editText.length / 1024).toFixed(2)} KB`,
      content: editText
    });
    setIsEditing(false);
  };

  const handlePasteDemo = () => {
    let content = '';
    let name = '';
    if (type === 'invoice') {
      name = 'INV-2026-904.txt';
      content = `--- VENDOR INVOICE ---\nInvoice Number: INV-2026-904\nInvoice Date: 2026-05-15\nVendor: Apex Systems Inc.\nBill To: Enterprise Corp Inc.\nPurchase Order Reference: PO-998811\n\nLINE ITEMS:\n1. Enterprise Rack Server v5\n   Qty: 5 units\n   Unit Price: $2,400.00\n   Total Price: $12,000.00\n\nTotal Due: $12,450.00`;
    } else if (type === 'po') {
      name = 'PO-998811.txt';
      content = `--- PURCHASE ORDER ---\nPO Number: PO-998811\nPO Date: 2026-05-01\nVendor: Apex Systems Inc.\n\nLINE ITEMS:\n1. Enterprise Rack Server v5\n   Qty: 5 units\n   Unit Price: $2,400.00\n   Total Price: $12,000.00`;
    } else if (type === 'receipt') {
      name = 'GRN-88741-Receipt.txt';
      content = `--- GOODS RECEIPT NOTE ---\nReceipt Number: GRN-88741\nReceipt Date: 2026-05-08\nPO Reference: PO-998811\n\nITEMS RECEIVED:\n1. Enterprise Rack Server v5\n   Qty Delivered: 5 units\nStatus: All verified.`;
    } else {
      name = 'SOP-Apex-Master-Agreement.txt';
      content = `--- MASTER SERVICES AGREEMENT ---\nContract ID: MSA-2025-APEX-09\nVendor: Apex Systems Inc.\n\nSection (Pricing Schedule):\n- Enterprise Rack Server v5: fixed price of $2,400.00 per unit.`;
    }
    setEditText(content);
    onUpdate({
      name,
      type,
      mimeType: 'text/plain',
      fileSize: `${(content.length / 1024).toFixed(2)} KB`,
      content
    });
    setIsEditing(false);
  };

  return (
    <div 
      className={`border rounded-xl transition-all duration-300 ${colors.border} ${
        isDragging ? 'scale-[1.01] bg-slate-800/60 ring-2 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900/90 hover:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
      } flex flex-col h-[280px] overflow-hidden`}
      id={`doc-card-${type}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Card Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${colors.banner}`}>
        <div className="flex items-center space-x-3">
          <FileText className={`w-5 h-5 ${colors.text} filter drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]`} />
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">{title}</h4>
            <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
          </div>
        </div>
        {document && (
          <button 
            type="button"
            onClick={() => onUpdate(null)} 
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800/70 p-1 rounded-full transition cursor-pointer"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 p-4 flex flex-col justify-between relative overflow-y-auto">
        {isEditing ? (
          <div className="flex flex-col h-full space-y-2">
            <textarea
              className="flex-1 w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder-slate-600 resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Paste or type document text here..."
            />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-mono">
                {editText.length} chars
              </span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[10px] border border-slate-800 hover:bg-slate-800 rounded font-semibold text-slate-450 text-slate-400 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveManualEdit}
                  className="px-2.5 py-1 text-[10px] bg-sky-600 hover:bg-sky-500 rounded font-semibold text-white transition shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : document ? (
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[150px]" title={document.name}>
                  {document.name}
                </span>
                <span className="text-[9px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-450 text-slate-400 font-semibold font-mono">
                  {document.fileSize || 'Text'}
                </span>
              </div>
              {document.mimeType?.startsWith('image/') || document.content?.startsWith('data:image/') ? (
                <div className="bg-slate-950/95 rounded-lg p-1 border border-slate-800/80 h-[115px] flex items-center justify-center overflow-hidden">
                  <img 
                    src={document.content} 
                    alt={document.name} 
                    className="max-h-full max-w-full object-contain cursor-pointer hover:scale-[1.03] transition duration-200" 
                    referrerPolicy="no-referrer"
                    onClick={() => {
                      const imgWindow = window.open("");
                      imgWindow?.document.write(`<div style="background:#0a0c14;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><img src="${document.content}" style="max-width:100%;max-height:100vh;object-fit:contain;margin:auto;display:block;" /></div>`);
                    }}
                    title="Click to view full screen image"
                  />
                </div>
              ) : document.mimeType?.includes('pdf') || document.content?.startsWith('data:application/pdf') ? (
                <div 
                  className="bg-slate-950 border border-slate-800 rounded-lg h-[115px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900 transition"
                  onClick={() => {
                    const pdfWindow = window.open("");
                    if (pdfWindow) {
                      pdfWindow.document.write(`<iframe width='100%' height='100%' style='border:0;margin:0;' src='${document.content}'></iframe>`);
                    }
                  }}
                  title="Click to open PDF full screen"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className="p-1 px-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 font-bold text-xs uppercase tracking-wider">PDF</div>
                    <span className="text-[10px] text-slate-300 font-bold max-w-[200px] truncate block mt-1">{document.name}</span>
                    <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Double click or click to open PDF</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800/80 h-[115px] overflow-y-auto font-mono text-[10.5px] text-[#bfdbfe] text-slate-105 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin">
                  {document.content && document.content.length > 250 
                    ? `${document.content.substring(0, 250)}...\n[Truncated - Full text sent to engine]`
                    : document.content || <em className="text-slate-600">[Empty document contents]</em>}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 mt-2">
              <button
                type="button"
                onClick={startManualEdit}
                className="flex items-center space-x-1.5 px-2.5 py-1 border border-slate-800 rounded bg-slate-950 hover:bg-slate-900 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
              >
                <Edit className="w-3 h-3 text-sky-400" />
                <span>Override/Edit Text</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-lg bg-slate-950/20 px-3 py-4 text-center">
            <Upload className={`w-8 h-8 ${isDragging ? 'text-sky-400 animate-bounce' : 'text-slate-500'} mb-2`} />
            <p className="text-[11px] font-bold text-slate-350 text-slate-300">Drag & drop compliance file</p>
            <p className="text-[9px] text-slate-505 text-slate-500 mt-0.5 mb-2.5">Supports invoice copy (.pdf, .jpg, .png) or text (.txt, .json, .csv)</p>
            
            <div className="flex items-center space-x-1.5">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9.5px] font-bold tracking-tight transition cursor-pointer"
              >
                Choose File
              </button>
              <button 
                type="button"
                onClick={startManualEdit}
                className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded text-[9.5px] font-bold tracking-tight transition cursor-pointer"
              >
                Paste Text
              </button>
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <button
                type="button"
                onClick={handlePasteDemo}
                className="text-[9px] text-slate-500 hover:text-slate-300 font-bold underline decoration-slate-700 cursor-pointer"
              >
                Apply Sample Draft
              </button>
            </div>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".txt,.csv,.json,.xml,.md,.pdf,image/*" 
              className="hidden" 
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};
