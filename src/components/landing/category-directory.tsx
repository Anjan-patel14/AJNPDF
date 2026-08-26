import Link from 'next/link';
import { ArrowRight, CheckSquare2, FileImage, FileText, RefreshCcw } from 'lucide-react';
import { MainFooter } from './main-footer';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { Navbar } from './navbar';
import { getPublicToolCategory, type PublicToolCategory } from '@/lib/tools-data';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { toolPath } from '@/lib/tool-routes';

const icons = { conversion: RefreshCcw, image: FileImage, pdf: FileText };
const titles = { conversion: 'Document and file conversion tools', image: 'Image tools and image conversions', pdf: 'PDF editing, security and utility tools' };
const descriptions = {
  conversion: 'Convert PDFs, office files, images, eBooks, email files and structured data with focused workflows and clear output choices.',
  image: 'Convert images to PDF, export PDF pages as images, scan document photos and prepare image files for sharing.',
  pdf: 'Merge, split, organize, edit, sign, protect, unlock, repair and optimize PDF documents from one consistent workspace.',
};
const intentContent = {
  conversion:{outcomes:['Convert PDFs to editable document formats','Create PDFs from documents and structured data','Run  on scans and document photos'],workflows:[{href:'/pdf-to-docx',label:'PDF to Word'},{href:'/docx-to-pdf',label:'Word to PDF'},{href:'/pdf-to-xlsx',label:'PDF to Excel'}]},
  image:{outcomes:['Combine images into a PDF','Export PDF pages into image files','Prepare scans, receipts and searchable documents'],workflows:[{href:'/jpg-to-pdf',label:'JPG to PDF'},{href:'/png-to-pdf',label:'PNG to PDF'},{href:'/pdf-to-png',label:'PDF to PNG'}]},
  pdf:{outcomes:['Combine, split and organize pages','Protect, unlock and repair authorized files','Compress, crop, rotate and prepare documents'],workflows:[{href:'/merge-pdf',label:'Merge PDF'},{href:'/split-pdf',label:'Split PDF'},{href:'/compress-pdf',label:'Compress PDF'},{href:'/protect-pdf',label:'Protect PDF'}]},
} as const;

export function CategoryDirectory({ category }: { category: PublicToolCategory }) {
  const tools=BUILD_PUBLIC_TOOLS.filter(tool=>getPublicToolCategory(tool)===category); const Icon=icons[category]; const intent=intentContent[category];
  return <div className="ajn-page-shell"><Navbar/><main className="relative z-10 pb-24 pt-28 md:pt-36"><section className="mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-8"><div className="mx-auto max-w-4xl text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-7 w-7"/></div><h1 className="mt-6 text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[.98] tracking-[-.05em] text-foreground">{titles[category]}</h1><p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-muted-foreground">{descriptions[category]}</p><p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-blue-600">{tools.length} tools available</p></div>
  <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">{intent.outcomes.map(outcome=><div key={outcome} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><CheckSquare2 className="h-5 w-5 text-emerald-600"/><p className="mt-3 text-sm font-black leading-6 text-card-foreground">{outcome}</p></div>)}</div>
  <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{tools.map(tool=><Link key={tool.id} href={toolPath(tool.id)} className="ajn-tool-card ajn-horizontal-tool-card group block"><div className="relative z-10 flex min-h-[80px] items-center gap-3 p-3"><ToolArtwork toolId={tool.id} toolName={tool.name} className="h-11 w-11"/><div className="min-w-0 flex-1"><div className="flex items-center justify-end"><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"/></div><h2 className="-mt-3 line-clamp-1 text-[14px] font-black tracking-tight text-foreground">{tool.name}</h2><p className="mt-1 line-clamp-1 text-[11px] font-medium leading-4 text-muted-foreground">{tool.desc}</p></div></div></Link>)}</div>
  <section className="mt-16 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10"><div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><div><span className="ajn-section-kicker">Choose a workflow</span><h2 className="mt-5 text-3xl font-black tracking-tight text-foreground">Start with the outcome you need.</h2><p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">Each tool page keeps supported inputs, relevant options, expected output and important limitations close to the workflow.</p><p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">For important documents, open the downloaded result in its destination application and review pages, text, tables, images and permissions before replacing the source.</p></div><div className="rounded-2xl border border-border bg-muted/45 p-6"><h3 className="text-lg font-black text-foreground">Useful starting points</h3><div className="mt-4 space-y-3">{intent.workflows.map(workflow=><Link key={workflow.href} href={workflow.href} className="group flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm font-black text-card-foreground shadow-sm transition hover:text-blue-700"><span>{workflow.label}</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link>)}</div></div></div></section>
</section></main><MainFooter/></div>;
}
