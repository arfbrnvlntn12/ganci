import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FolderOpen, 
  Trash2, 
  Layers, 
  User, 
  Save, 
  RotateCw, 
  Maximize, 
  Minimize, 
  Copy, 
  X,
  Palette,
  Type,
  Layout,
  Plus,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KeychainItem, SidebarTab } from './types';
import { supabase } from './lib/supabase';

// Constants for 300 DPI A4
const SLOTS_PER_PAGE = 35;
const COLS = 7;
const ROWS = 5;
const CANVAS_W = 2563; 
const CANVAS_H = 3508;
const UNIT_W = 343;    
const UNIT_H = 591;    

export default function App() {
  const [items, setItems] = useState<KeychainItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('massal');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Database States
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('New Project');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  };

  const saveToDb = async () => {
    setIsLoading(true);
    setLoadingText('Menyimpan ke Database...');
    try {
      let projectId = currentProjectId;
      if (!projectId) {
        const { data, error } = await supabase.from('projects').insert([{ name: projectName }]).select();
        if (error) throw error;
        projectId = data[0].id;
        setCurrentProjectId(projectId);
        await fetchProjects();
      }

      // Delete existing
      await supabase.from('keychain_items').delete().eq('project_id', projectId);

      if (items.length > 0) {
        const payload = items.map(item => ({
          id: item.id,
          project_id: projectId,
          resi: item.resi,
          name: item.name,
          textColor: item.textColor,
          outlineColor: item.outlineColor,
          bgColor: item.bgColor,
          fontFamily: item.fontFamily,
          useOutline: item.useOutline,
          outlineWidth: item.outlineWidth,
          textScale: item.textScale,
          textPosX: item.textPos.x,
          textPosY: item.textPos.y,
          transformX: item.transform.x,
          transformY: item.transform.y,
          transformScale: item.transform.scale,
          transformRotate: item.transform.rotate,
          imgW: item.imgW,
          imgH: item.imgH,
          imageData: item.imageData
        }));
        
        const { error } = await supabase.from('keychain_items').insert(payload);
        if (error) throw error;
      }
      
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    setIsLoading(true);
    setLoadingText('Memuat Project...');
    try {
      const { data, error } = await supabase.from('keychain_items').select('*').eq('project_id', id);
      if (error) throw error;
      
      if (data) {
        const loadedItems = data.map((d: any) => ({
          id: d.id,
          resi: d.resi,
          name: d.name,
          textColor: d.textColor,
          outlineColor: d.outlineColor,
          bgColor: d.bgColor,
          fontFamily: d.fontFamily,
          useOutline: !!d.useOutline,
          outlineWidth: d.outlineWidth,
          textScale: d.textScale,
          textPos: { x: d.textPosX, y: d.textPosY },
          transform: { x: d.transformX, y: d.transformY, scale: d.transformScale, rotate: d.transformRotate },
          imgW: d.imgW,
          imgH: d.imgH,
          previewUrl: d.imageData,
          imageData: d.imageData
        }));
        setItems(loadedItems);
      }
      
      setCurrentProjectId(id);
      const proj = projects.find(p => p.id === id);
      if (proj) setProjectName(proj.name.split(' | KCP-')[0]);
      setSelectedId(null);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Kode Akses Kilat System
  const [inputShareCode, setInputShareCode] = useState('');

  const generateShareCode = async () => {
    if (!currentProjectId) {
      alert("Simpan proyek ke Cloud Database terlebih dahulu sebelum membagikannya.");
      return;
    }
    const code = "KCP-" + Math.floor(100000 + Math.random() * 900000);
    const newName = `${projectName.split(' | KCP-')[0]} | ${code}`;
    
    setIsLoading(true);
    setLoadingText('Membuat Kode Akses...');
    try {
      const { error } = await supabase.from('projects').update({ name: newName }).eq('id', currentProjectId);
      if (error) throw error;
      // Re-fetch project list silently without hiding project name
      await fetchProjects();
      alert(`Kode Berhasil Dibuat!\nBeritahu ini ke teman Anda untuk ditarik: ${code}`);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat kode unik.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromShareCode = async () => {
    if (!inputShareCode.trim()) return;
    
    setIsLoading(true);
    setLoadingText('Mencari Kode...');
    
    try {
      // Fetch specifically for the requested code to avoid stale local state and ensure User 2 gets real-time sync
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .like('name', `%${inputShareCode.trim().toUpperCase()}%`);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const found = data[0];
        // Ensure the found project is in the local projects list
        setProjects(prev => prev.some(p => p.id === found.id) ? prev : [found, ...prev]);
        
        await loadProject(found.id);
        setInputShareCode('');
      } else {
        alert(`Kode ${inputShareCode} tidak ditemukan di Cloud Database.`);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat mencari kode di Server.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Global states for Massal updates
  const [globalTextColor, setGlobalTextColor] = useState('#ffffff');
  const [globalOutlineColor, setGlobalOutlineColor] = useState('#000000');
  const [globalBgColor, setGlobalBgColor] = useState('#ffffff');
  const [globalFont, setGlobalFont] = useState("'Fredoka', sans-serif");
  const [globalUseOutline, setGlobalUseOutline] = useState(true);
  const [globalOutlineWidth, setGlobalOutlineWidth] = useState(8);

  // Custom Fonts State
  const [customFonts, setCustomFonts] = useState<{name: string, family: string, url: string}[]>([]);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      const familyName = `CustomFont_${fontName}_${Date.now()}`;
      
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${familyName}';
          src: url(${dataUrl});
        }
      `;
      document.head.appendChild(style);

      const newFont = { name: fontName, family: `'${familyName}'`, url: dataUrl };
      setCustomFonts(prev => [...prev, newFont]);
      updateGlobalSettings('font', `'${familyName}'`);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // --- Selection Logic ---
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setActiveTab('individu'); // Auto-switch to individual tab when clicked
  };

  const activeItem = items.find(i => i.id === selectedId);

  // --- Item Management ---
  const updateItem = useCallback((id: string, updates: Partial<KeychainItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const updateGlobalSettings = (field: string, value: any) => {
    if (field === 'textColor') setGlobalTextColor(value);
    if (field === 'outlineColor') setGlobalOutlineColor(value);
    if (field === 'bgColor') setGlobalBgColor(value);
    if (field === 'font') setGlobalFont(value);
    if (field === 'useOutline') setGlobalUseOutline(value);
    if (field === 'outlineWidth') setGlobalOutlineWidth(value);

    // Apply to all items if in Massal mode
    setItems(prev => prev.map(item => {
      const fieldMap: Record<string, string> = {
        textColor: 'textColor',
        outlineColor: 'outlineColor',
        bgColor: 'bgColor',
        font: 'fontFamily',
        useOutline: 'useOutline',
        outlineWidth: 'outlineWidth'
      };
      const itemField = fieldMap[field];
      return { ...item, [itemField]: value };
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateItem = (id: string) => {
    const original = items.find(i => i.id === id);
    if (!original) return;
    const newItem: KeychainItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: `id_${Math.random().toString(36).substr(2, 9)}`,
      previewUrl: original.previewUrl,
      file: original.file
    };
    const index = items.indexOf(original);
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    setItems(newItems);
  };

  // --- Folder Handling ---
  const loadImage = (source: File | string): Promise<{img: HTMLImageElement, dataUrl: string}> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (typeof source === 'string') {
        img.onload = () => resolve({img, dataUrl: source});
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          img.onload = () => resolve({img, dataUrl});
          img.src = dataUrl;
        };
        reader.readAsDataURL(source);
      }
    });
  };

  const getSmartColor = (img: HTMLImageElement) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#ffffff';
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      if (data[3] < 255) return "#ffffff";
      return "#" + ("0" + data[0].toString(16)).slice(-2) + 
                   ("0" + data[1].toString(16)).slice(-2) + 
                   ("0" + data[2].toString(16)).slice(-2);
    } catch (e) { return "#f1f5f9"; }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = (Array.from(fileList) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsLoading(true);
    setLoadingText('Menganalisis Foto...');

    const newItems: KeychainItem[] = [];
    
    // Group files by folder manually from path
    const groups: Record<string, File[]> = {};
    files.forEach(file => {
      const pathParts = (file as any).webkitRelativePath?.split('/') || [];
      const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "Tanpa Folder";
      if (!groups[folderName]) groups[folderName] = [];
      groups[folderName].push(file);
    });

    for (const [folderName, photoFiles] of Object.entries(groups)) {
      let resi = "", name = "";
      if (folderName.includes(' - ')) {
        const split = folderName.split(' - ');
        resi = split[0].trim(); name = split[1].trim();
      } else { resi = folderName; }

      for (const file of (photoFiles as File[])) {
        const {img, dataUrl} = await loadImage(file);
        const minScale = Math.max(UNIT_W / img.width, UNIT_H / img.height);
        const smartBg = getSmartColor(img);
        
        const cacheKey = file.name + file.size;
        imageCache.current.set(cacheKey, img);

        newItems.push({
          id: `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
          file: file,
          imageData: dataUrl,
          previewUrl: dataUrl,
          resi: resi,
          name: name,
          textColor: globalTextColor,
          outlineColor: globalOutlineColor,
          bgColor: smartBg,
          fontFamily: globalFont,
          useOutline: globalUseOutline,
          outlineWidth: globalOutlineWidth,
          textScale: 32,
          textPos: { x: 50, y: 90 },
          transform: { x: 0, y: 0, scale: minScale, rotate: 0 }, 
          imgW: img.width,
          imgH: img.height
        });
      }
    }

    setItems(prev => [...prev, ...newItems]);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Rendering High DPI ---
  const handleExportOrPrint = async (mode: 'download' | 'print') => {
    setIsLoading(true);
    setLoadingText(mode === 'print' ? 'Menyiapkan Cetak...' : 'Memulai Ekspor...');
    
    try {
      const pageCount = Math.ceil(items.length / SLOTS_PER_PAGE);
      const gutterX = (CANVAS_W - (COLS * UNIT_W)) / (COLS + 1);
      const gutterY = (CANVAS_H - (ROWS * UNIT_H)) / (ROWS + 1);

      const generatedImages: string[] = [];

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        setLoadingText(`Rakit Lembar ${pIdx + 1} / ${pageCount}...`);
        
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W; canvas.height = CANVAS_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        const pageUnits = items.slice(pIdx * SLOTS_PER_PAGE, (pIdx + 1) * SLOTS_PER_PAGE);

        for (let i = 0; i < pageUnits.length; i++) {
          const item = pageUnits[i];
          const curX = gutterX + ((i % COLS) * (UNIT_W + gutterX));
          const curY = gutterY + (Math.floor(i / COLS) * (UNIT_H + gutterY)) + 40;

          let img = imageCache.current.get(item.id);
          if (!img) {
             const loaded = await loadImage(item.imageData || item.file!);
             img = loaded.img;
             imageCache.current.set(item.id, img);
          }
          
          ctx.save();
          // Drawing labels above cut lines
          ctx.fillStyle = "#64748b"; 
          ctx.textAlign = "center"; 
          ctx.font = "bold 28px sans-serif";
          ctx.fillText(item.resi.toUpperCase() || "RESI KOSONG", curX + (UNIT_W / 2), curY - 22);
          
          // Cut lines
          ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 5;
          ctx.strokeRect(curX, curY, UNIT_W, UNIT_H);

          // Background
          ctx.beginPath(); ctx.rect(curX, curY, UNIT_W, UNIT_H); ctx.clip();
          ctx.fillStyle = item.bgColor;
          ctx.fillRect(curX, curY, UNIT_W, UNIT_H);

          // Photo Transform
          ctx.translate(curX + UNIT_W/2, curY + UNIT_H/2);
          ctx.translate(item.transform.x, item.transform.y);
          ctx.rotate(item.transform.rotate * Math.PI / 180);
          ctx.scale(item.transform.scale, item.transform.scale);
          ctx.drawImage(img, -item.imgW/2, -item.imgH/2, item.imgW, item.imgH);
          ctx.restore();

          // Text Overlay
          if (item.name) {
            const tx = curX + (UNIT_W * (item.textPos.x / 100));
            const ty = curY + (UNIT_H * (item.textPos.y / 100));
            drawTextOnCanvas(ctx, item, tx, ty);
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (mode === 'download') {
          const link = document.createElement('a');
          link.download = `Keychain_Lembar_${pIdx + 1}.jpg`;
          link.href = dataUrl;
          link.click();
          await new Promise(r => setTimeout(r, 100));
        } else {
          generatedImages.push(dataUrl);
        }
      }

      if (mode === 'print') {
         const printWindow = window.open('', '_blank');
         if (printWindow) {
           let html = `
             <html>
               <head>
                 <title>Cetak Print-Flow</title>
                 <style>
                    body { margin: 0; padding: 0; background: #fff; }
                    @page { size: A4; margin: 0; }
                    img { width: 210mm; height: 297mm; display: block; break-after: page; page-break-after: always; margin: 0; padding: 0; box-sizing: border-box; }
                 </style>
               </head>
               <body>
                 ${generatedImages.map(url => `<img src="${url}" />`).join('')}
                 <script>
                    window.onload = function() { setTimeout(() => { window.print(); }, 500); }
                 </script>
               </body>
             </html>
           `;
           printWindow.document.write(html);
           printWindow.document.close();
         }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const drawTextOnCanvas = (ctx: CanvasRenderingContext2D, item: KeychainItem, x: number, y: number) => {
    ctx.save();
    let size = item.textScale;
    ctx.font = `900 ${size}px ${item.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    const text = item.name.toUpperCase();
    const maxW = UNIT_W - 40;

    // Word Wrap logic
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      if (ctx.measureText(currentLine + " " + words[i]).width > maxW) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine += " " + words[i];
      }
    }
    lines.push(currentLine);

    // Auto Font Scaling
    while (lines.some(l => ctx.measureText(l).width > maxW) && size > 12) {
      size--;
      ctx.font = `900 ${size}px ${item.fontFamily}`;
    }

    const lineHeight = size * 1.15;
    const startY = y - ((lines.length - 1) * lineHeight / 2);

    lines.forEach((line, i) => {
      const lineY = startY + (i * lineHeight);
      if (item.useOutline) {
        ctx.strokeStyle = item.outlineColor;
        ctx.lineWidth = item.outlineWidth;
        ctx.strokeText(line, x, lineY);
      }
      ctx.fillStyle = item.textColor;
      ctx.fillText(line, x, lineY);
    });
    ctx.restore();
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-inter select-none">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 z-[999] flex flex-col items-center justify-center backdrop-blur-sm"
          >
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-6 text-xl font-black text-slate-800 uppercase tracking-widest">{loadingText}</p>
            <p className="text-sm font-medium text-slate-400 italic mt-2">Menerapkan Pemetaan Piksel 300 DPI...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className="w-[300px] h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col z-[100] shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">🖼️</div>
          <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-tighter">Print-Flow</h1>
        </div>

        {/* TABS HEADER & DB ACTIONS */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex gap-2">
             <input type="text" value={projectName} onChange={e => setProjectName(e.target.value.split(' | KCP-')[0])} className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 font-bold w-1/2" placeholder="Nama Project" />
             <select 
                className="w-1/2 text-xs border border-slate-200 rounded-lg bg-white px-1"
                value={currentProjectId || ''}
                onChange={(e) => {
                    const val = e.target.value;
                    if(val) loadProject(val);
                }}
             >
                <option value="">Load Project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name.split(' | KCP-')[0]}</option>)}
             </select>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputShareCode} 
              onChange={e => setInputShareCode(e.target.value.toUpperCase())} 
              className="flex-1 text-[11px] border border-blue-200 bg-blue-50/50 rounded-lg px-2 py-1.5 font-black uppercase tracking-widest text-center text-blue-900 outline-none focus:border-blue-500 transition-colors placeholder:font-bold placeholder:text-blue-300" 
              placeholder="KODE: KCP-XXX" 
            />
            <button 
              onClick={loadFromShareCode}
              disabled={!inputShareCode}
              className="px-4 bg-indigo-600 text-white hover:bg-slate-900 font-bold rounded-lg text-[10px] uppercase transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tarik
            </button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl mt-1">
            <button 
              onClick={() => setActiveTab('massal')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'massal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Massal
            </button>
            <button 
              onClick={() => setActiveTab('individu')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'individu' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Individu
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {activeTab === 'individu' && activeItem && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Editing Active Unit</p>
              <p className="text-sm font-bold text-blue-700 truncate">
                <strong>Unit:</strong> {activeItem.resi || activeItem.id.slice(0, 8)}
              </p>
            </div>
          )}

          {activeTab === 'massal' ? (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-indigo-100 uppercase text-xs flex items-center justify-center gap-3 group"
              >
                <FolderOpen className="group-hover:scale-110 transition-transform" />
                Upload Folder Massal
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                {...{webkitdirectory: "", directory: ""} as any} 
              />
              <input 
                ref={fontInputRef}
                type="file" 
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontUpload} 
                className="hidden" 
              />

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Pengaturan Global</p>
                
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Garis Tepi</span>
                  <button 
                    onClick={() => updateGlobalSettings('useOutline', !globalUseOutline)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${globalUseOutline ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalUseOutline ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ColorControl label="Teks" value={globalTextColor} onChange={v => updateGlobalSettings('textColor', v)} />
                  <ColorControl label="Garis" value={globalOutlineColor} onChange={v => updateGlobalSettings('outlineColor', v)} />
                  <ColorControl label="Warna BG" value={globalBgColor} onChange={v => updateGlobalSettings('bgColor', v)} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Gaya Font</label>
                    <button 
                      onClick={() => fontInputRef.current?.click()}
                      className="text-[8px] font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                    >
                      + FONT SENDIRI
                    </button>
                  </div>
                  <select 
                    value={globalFont}
                    onChange={(e) => updateGlobalSettings('font', e.target.value)}
                    className="w-full h-12 rounded-2xl border-2 border-white px-4 text-[11px] font-black outline-none bg-white shadow-sm appearance-none"
                  >
                    {customFonts.length > 0 && <optgroup label="Font Custom">
                      {customFonts.map(f => <option key={f.family} value={f.family}>{f.name.toUpperCase()}</option>)}
                    </optgroup>}
                    <optgroup label="Font Bawaan">
                      <option value="'Fredoka', sans-serif">FREDOKA (Clean Cute)</option>
                      <option value="'Bubblegum Sans', cursive">BUBBLEGUM SANS (Soft)</option>
                      <option value="'DynaPuff', cursive">DYNAPUFF (Extra Puffy)</option>
                      <option value="'Grandstander', cursive">GRANDSTANDER (Aesthetic)</option>
                      <option value="'Titan One', cursive">TITAN ONE (Bold)</option>
                      <option value="'Chewy', cursive">CHEWY (Playful)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Ketebalan Garis</label>
                    <span className="text-[10px] font-bold text-blue-600">{globalOutlineWidth}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="40" step="1"
                    value={globalOutlineWidth}
                    onChange={(e) => updateGlobalSettings('outlineWidth', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              {activeItem ? (
                <div className="space-y-8">
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                      <User className="text-indigo-600" size={32} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Unit Sedang Diedit</span>
                    <h3 className="text-xl font-black text-indigo-900 truncate w-full text-center">{activeItem.resi || "Unit Tanpa Resi"}</h3>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Item</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Resi Pengiriman</label>
                        <input 
                          type="text" 
                          value={activeItem.resi} 
                          onChange={(e) => updateItem(activeItem.id, { resi: e.target.value })}
                          className="w-full h-12 px-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Nama Gantungan</label>
                        <input 
                          type="text" 
                          value={activeItem.name} 
                          onChange={(e) => updateItem(activeItem.id, { name: e.target.value })}
                          className="w-full h-12 px-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <ColorControl label="Teks" value={activeItem.textColor} onChange={v => updateItem(activeItem.id, { textColor: v })} />
                      <ColorControl label="Garis" value={activeItem.outlineColor} onChange={v => updateItem(activeItem.id, { outlineColor: v })} />
                      <ColorControl label="Warna BG" value={activeItem.bgColor} onChange={v => updateItem(activeItem.id, { bgColor: v })} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Gaya Font Khusus</label>
                        <button 
                          onClick={() => fontInputRef.current?.click()}
                          className="text-[8px] font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                        >
                          + UP FONT
                        </button>
                      </div>
                      <select 
                        value={activeItem.fontFamily}
                        onChange={(e) => updateItem(activeItem.id, { fontFamily: e.target.value })}
                        className="w-full h-12 rounded-2xl border-2 border-slate-200 px-4 text-[11px] font-black outline-none bg-white shadow-sm appearance-none"
                      >
                        {customFonts.length > 0 && <optgroup label="Font Custom">
                          {customFonts.map(f => <option key={f.family} value={f.family}>{f.name.toUpperCase()}</option>)}
                        </optgroup>}
                        <optgroup label="Font Bawaan">
                          <option value="'Fredoka', sans-serif">FREDOKA</option>
                          <option value="'Bubblegum Sans', cursive">BUBBLEGUM</option>
                          <option value="'DynaPuff', cursive">DYNAPUFF</option>
                          <option value="'Grandstander', cursive">GRANDSTANDER</option>
                          <option value="'Titan One', cursive">TITAN ONE</option>
                          <option value="'Chewy', cursive">CHEWY</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Ketebalan Garis Unit</label>
                        <span className="text-[10px] font-bold text-blue-600">{activeItem.outlineWidth}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="40" step="1"
                        value={activeItem.outlineWidth}
                        onChange={(e) => updateItem(activeItem.id, { outlineWidth: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Layout className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Klik salah satu foto di lembar kerja untuk mulai mengedit detailnya secara individu.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800">
           <div className="flex justify-between items-end mb-4">
            <span className="text-4xl font-black text-white leading-none">{items.length}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Unit Foto</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(items.length % SLOTS_PER_PAGE || (items.length > 0 ? SLOTS_PER_PAGE : 0)) / SLOTS_PER_PAGE * 100}%` }}
              className="absolute inset-y-0 left-0 bg-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button 
                disabled={items.length === 0}
                onClick={() => handleExportOrPrint('download')}
                className="flex-1 bg-blue-600 hover:bg-white hover:text-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest text-[9px] disabled:opacity-20 flex items-center justify-center gap-1"
              >
                Unduh JPG
              </button>
              <button 
                disabled={items.length === 0}
                onClick={() => handleExportOrPrint('print')}
                className="flex-1 bg-purple-600 hover:bg-white hover:text-purple-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/40 uppercase tracking-widest text-[9px] disabled:opacity-20 flex items-center justify-center gap-1"
              >
                Cetak (Print)
              </button>
            </div>
            <button 
              disabled={items.length === 0}
              onClick={saveToDb}
              className="w-full bg-emerald-600 hover:bg-white hover:text-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 uppercase tracking-widest text-[9px] disabled:opacity-20 flex items-center justify-center gap-1"
            >
              <Save size={14} /> Simpan ke Cloud Database
            </button>
            <button 
              disabled={!currentProjectId}
              onClick={generateShareCode}
              title={!currentProjectId ? "Simpan proyek ke database dulu" : "Bagikan proyek ini dengan kode unik"}
              className="w-full bg-orange-500 hover:bg-white hover:text-orange-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[9px] disabled:opacity-20 flex items-center justify-center gap-1"
            >
              Bagi ke Teman (Kode Akses)
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f4f5f7]">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto border border-slate-200">
                <Plus size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pilih Folder untuk Memulai</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-slate-800 font-extrabold text-lg uppercase tracking-tight">A4 Layout Preview <span className="text-slate-400 font-medium lowercase">({items.length} units)</span></h2>
              <div className="flex gap-2">
                <button className="input-pill bg-white hover:bg-slate-50 transition-colors font-bold uppercase text-[10px]">Zoom 100%</button>
                <button onClick={() => window.location.reload()} className="input-pill bg-white hover:bg-slate-50 transition-colors font-bold uppercase text-[10px]">Reset All</button>
              </div>
            </div>
            {Array.from({ length: Math.ceil(items.length / SLOTS_PER_PAGE) }).map((_, pIdx) => {
              const pageItems = items.slice(pIdx * SLOTS_PER_PAGE, (pIdx + 1) * SLOTS_PER_PAGE);
              return (
                <div key={pIdx} className="page-frame animate-in fade-in zoom-in-95 duration-500">
                   <div className="absolute -top-4 left-8 bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-lg z-20">
                    Lembar {pIdx + 1}
                  </div>
                  <div className="grid grid-cols-7 gap-4">
                    {pageItems.map((item: KeychainItem) => (
                      <UnitCard 
                        key={item.id} 
                        item={item} 
                        isSelected={selectedId === item.id}
                        onSelect={() => handleSelect(item.id)}
                        onUpdate={(u: Partial<KeychainItem>) => updateItem(item.id, u)}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <button 
              onClick={() => {
                if (window.confirm("Hapus semua data di meja kerja?")) {
                  setItems([]);
                  setSelectedId(null);
                  imageCache.current.clear();
                }
              }}
              className="mx-auto block text-slate-300 hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-colors mb-20"
            >
              Kosongkan Meja Kerja
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ColorControl({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center">
      <label className="text-[8px] font-black text-slate-400 mb-1.5 uppercase">{label}</label>
      <div className="relative w-full h-10 group">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div 
          className="w-full h-full rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

function UnitCard({ 
  item, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onRemove, 
  onDuplicate 
}: { 
  item: KeychainItem, 
  isSelected: boolean,
  onSelect: () => void,
  onUpdate: (u: Partial<KeychainItem>) => void,
  onRemove: () => void,
  onDuplicate: () => void,
  key?: React.Key
}) {
  const [isDragging, setIsDragging] = useState<'photo' | 'text' | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const vfRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: 'photo' | 'text') => {
    e.stopPropagation();
    onSelect(); // Ensure it's active when touched
    setIsDragging(type);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (type === 'photo') {
      dragStart.current = { x: clientX - item.transform.x, y: clientY - item.transform.y };
    } else {
      dragStart.current = { x: clientX, y: clientY };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (isDragging === 'photo') {
        onUpdate({ 
          transform: { 
            ...item.transform, 
            x: clientX - dragStart.current.x, 
            y: clientY - dragStart.current.y 
          } 
        });
      } else if (isDragging === 'text' && vfRef.current) {
        const rect = vfRef.current.getBoundingClientRect();
        const xPercent = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        const yPercent = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
        onUpdate({ textPos: { x: xPercent, y: yPercent } });
      }
    };

    const handleEnd = () => setIsDragging(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, item, onUpdate]);

  const fitW = () => onUpdate({ transform: { ...item.transform, scale: UNIT_W / item.imgW, x: 0, y: 0 } });
  const fitH = () => onUpdate({ transform: { ...item.transform, scale: UNIT_H / item.imgH, x: 0, y: 0 } });
  const rotate = (deg: number) => onUpdate({ transform: { ...item.transform, rotate: item.transform.rotate + deg } });

  // Ratio for the CSS viewfinder (approx 0.43 of printed size)
  const ratio = (vfRef.current?.offsetWidth || 150) / UNIT_W;

  return (
    <div 
      className={`unit-card ${isSelected ? 'selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-2 -right-2 bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-red-500"
      >
        <X size={10} strokeWidth={4} />
      </button>

      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{item.resi || "JX-000"}</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.textColor }} />
          <div className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: item.bgColor }} />
        </div>
      </div>

      <div 
        ref={vfRef}
        className={`unit-viewfinder ${isSelected ? 'selected' : ''}`}
        style={{ backgroundColor: item.bgColor }}
        onMouseDown={(e) => handleDragStart(e, 'photo')}
        onTouchStart={(e) => handleDragStart(e, 'photo')}
      >
        <motion.img 
          src={item.previewUrl} 
          draggable={false}
          className="unit-photo"
          style={{
            width: item.imgW,
            height: item.imgH,
            x: `calc(-50% + ${item.transform.x * ratio}px)`,
            y: `calc(-50% + ${item.transform.y * ratio}px)`,
            scale: item.transform.scale * ratio,
            rotate: item.transform.rotate
          }}
        />
        
        {item.name && (
          <div 
            className="text-preview pointer-events-auto"
            style={{
              left: `${item.textPos.x}%`,
              top: `${item.textPos.y}%`,
              fontSize: `${item.textScale * ratio}px`,
              color: item.textColor,
              fontFamily: item.fontFamily,
              textTransform: 'uppercase',
              WebkitTextStroke: item.useOutline ? `${(item.outlineWidth * ratio)}px ${item.outlineColor}` : 'none',
              paintOrder: 'stroke fill',
            }}
            onMouseDown={(e) => handleDragStart(e, 'text')}
            onTouchStart={(e) => handleDragStart(e, 'text')}
          >
            {item.name}
          </div>
        )}
      </div>

      <input 
        type="text" 
        value={item.name} 
        placeholder="NAMA"
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="w-full text-[10px] font-black uppercase text-indigo-700 bg-indigo-50/50 border border-indigo-100 rounded-md px-2 py-1 outline-none text-center"
      />

      <div className="space-y-1.5 mt-1">
        <div className="flex gap-1">
           <ControlBtn icon={<Maximize size={10} />} onClick={fitW} label="Fit W" />
           <ControlBtn icon={<Maximize size={10} className="rotate-90" />} onClick={fitH} label="Fit H" />
           <ControlBtn icon={<Copy size={10} />} onClick={onDuplicate} label="DUP" />
        </div>
        
        <div className="flex gap-1">
          <ControlBtn icon={<RotateCw size={10} className="-scale-x-100" />} onClick={() => rotate(-90)} />
          <div className="flex-1 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center gap-1 relative overflow-hidden">
            <input 
              type="color" 
              value={item.bgColor} 
              onChange={(e) => onUpdate({ bgColor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            <div className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: item.bgColor }} />
            <span className="text-[6px] font-black text-slate-500 uppercase">Warna BG</span>
          </div>
          <button 
            onClick={() => onUpdate({ useOutline: !item.useOutline })}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${item.useOutline ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
          >
            <Layers size={10} />
          </button>
          <ControlBtn icon={<RotateCw size={10} />} onClick={() => rotate(90)} />
        </div>

        <div className="flex gap-1">
          <IndividualColorPick label="Text" value={item.textColor} onChange={v => onUpdate({ textColor: v })} color={item.textColor} />
          <IndividualColorPick label="Line" value={item.outlineColor} onChange={v => onUpdate({ outlineColor: v })} color={item.outlineColor} />
        </div>

        <div className="px-1 py-1 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex justify-between items-center px-1 mb-0.5"><span className="text-[6px] font-black text-slate-400 uppercase">Zoom</span><span className="text-[6px] font-black text-indigo-600">{Math.round(item.transform.scale * 100)}%</span></div>
          <input 
            type="range" min="0.1" max="3" step="0.01" 
            value={item.transform.scale} 
            onChange={(e) => onUpdate({ transform: { ...item.transform, scale: parseFloat(e.target.value) }})}
            className="w-full h-1.5"
          />
        </div>
        <div className="px-1 py-1 bg-slate-50 rounded-lg border border-slate-100">
           <div className="flex justify-between items-center px-1 mb-0.5"><span className="text-[6px] font-black text-slate-400 uppercase">Font</span><span className="text-[6px] font-black text-indigo-600">{item.textScale}px</span></div>
          <input 
            type="range" min="12" max="100" 
            value={item.textScale} 
            onChange={(e) => onUpdate({ textScale: parseInt(e.target.value) })}
            className="w-full h-1.5"
          />
        </div>
      </div>
    </div>
  );
}

function ControlBtn({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label?: string }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex-1 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center gap-1 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
    >
      {icon}
      {label && <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>}
    </button>
  );
}

function IndividualColorPick({ label, value, onChange, color }: { label: string, value: string, onChange: (v: string) => void, color: string }) {
  return (
    <div className="flex-1 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center gap-1 relative overflow-hidden group">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
      <div className="w-2.5 h-2.5 rounded-full border border-slate-300 z-10" style={{ backgroundColor: color }} />
      <span className="text-[6px] font-black text-slate-500 uppercase z-10">{label}</span>
    </div>
  );
}
