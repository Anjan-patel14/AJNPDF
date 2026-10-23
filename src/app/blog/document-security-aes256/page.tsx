import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Browser-based PDF privacy and file handling | AJN PDF',
  description: 'Understand browser-based PDF processing, file limitations, and practical privacy checks before downloading a document.',
  alternates: { canonical: '/blog/document-security-aes256' },
};

export default function PdfPrivacyGuide() {
  return <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <p className="text-xs font-black uppercase tracking-widest text-blue-700">PDF guide</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">PDF privacy and file handling</h1>
    <p className="mt-4 leading-7 text-slate-600">AJN PDF’s public browser-based workflows process supported files in your browser. This does not mean every browser extension, device, or external integration is private by default, so review the permissions and behavior of the tools you use.</p>
    <section className="mt-8 space-y-3"><h2 className="text-xl font-black">Practical checks before using a PDF tool</h2><ul className="list-disc space-y-2 pl-5 leading-7 text-slate-700"><li>Use files you own or are authorized to edit.</li><li>Keep a separate original copy before changing or compressing a document.</li><li>Review the downloaded PDF in a viewer before sharing it.</li><li>Do not treat a visual signature image as a certificate-based digital signature.</li><li>For highly sensitive files, check your browser, device, and connected-app settings.</li></ul></section>
    <p className="mt-8 leading-7 text-slate-600">Browser workflows can have limitations with large files, complex layouts, unusual fonts, forms, or damaged documents. Check each tool’s instructions before relying on its output.</p>
    <Link href="/pdf-tools" className="mt-8 inline-flex font-bold text-blue-700 underline">Browse available PDF tools</Link>
  </main>;
}
