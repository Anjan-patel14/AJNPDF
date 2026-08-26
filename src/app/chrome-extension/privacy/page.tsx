import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';

export const metadata: Metadata = {
  title: 'AJN PDF Chrome Extension Privacy',
  description: 'Privacy information for the AJN PDF Quick Tools Chrome extension.',
  alternates: { canonical: '/chrome-extension/privacy' },
};

export default function ChromeExtensionPrivacyPage() {
  return (
    <div className="ajn-page-shell min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <p className="text-[10px] font-black uppercase tracking-[.13em] text-blue-600">AJN PDF Quick Tools</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] text-slate-950 md:text-5xl">Chrome extension privacy</h1>
        <p className="mt-5 text-sm font-medium leading-7 text-slate-600">This page describes the behavior of the AJN PDF Quick Tools Chrome extension package included with AJN PDF R10. It is separate from the privacy practices that apply after you voluntarily open ajnpdf.com.</p>
        <div className="mt-10 space-y-8 text-sm font-medium leading-7 text-slate-700">
          <section><h2 className="text-lg font-black text-slate-950">Permissions</h2><p className="mt-2">The extension manifest requests no host permissions and no permissions to read page content, browsing history, passwords, cookies or the contents of your open tabs.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Files you choose</h2><p className="mt-2">The local quick actions only receive image files that you explicitly select or drag into an extension page. Those image operations run in the extension page and the package contains no upload code for those local quick actions.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">AJN PDF website links</h2><p className="mt-2">The extension can open AJN PDF tool pages in a new Chrome tab. Once a website page is opened, the AJN PDF website privacy and cookie policies apply to that website visit.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Remote code</h2><p className="mt-2">The extension does not load or execute remotely hosted JavaScript. Its runtime HTML, CSS and JavaScript are packaged with the extension.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Contact and updates</h2><p className="mt-2">If a future extension version adds permissions or changes how user data is handled, the store listing and this disclosure should be updated before publishing that version.</p></section>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-black"><Link href="/chrome-extension" className="text-blue-700 hover:underline">Back to Chrome extension</Link><Link href="/privacy" className="text-slate-600 hover:text-blue-700">Website privacy policy</Link><Link href="/contact" className="text-slate-600 hover:text-blue-700">Contact</Link></div>
      </main>
      <MainFooter />
    </div>
  );
}
