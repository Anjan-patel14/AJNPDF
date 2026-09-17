import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bug, Copyright, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { MainFooter } from '@/components/landing/main-footer';
import { Navbar } from '@/components/landing/navbar';
import { AJN_BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Contact AJN PDF',
  description: 'Contact AJN PDF for tool support, bug reports, privacy requests, security disclosures, copyright matters and general product questions.',
  alternates: { canonical: '/contact' },
};

const contacts = [
  { title: 'General support', text: 'Questions about a PDF tool, result or website feature.', subject: 'AJN PDF Support', icon: Mail },
  { title: 'Privacy request', text: 'Privacy, data-deletion, cookie-consent or personal-information requests.', subject: 'AJN PDF Privacy Request', icon: ShieldCheck },
  { title: 'Security report', text: 'Private, reproducible security reports and responsible disclosure.', subject: 'AJN PDF Security Report', icon: ShieldAlert },
  { title: 'Copyright request', text: 'Complete copyright, DMCA or takedown notices.', subject: 'AJN PDF Copyright Request', icon: Copyright },
  { title: 'Bug report', text: 'Include the tool URL, browser, file type and exact error message. Do not attach confidential documents.', subject: 'AJN PDF Bug Report', icon: Bug },
] as const;

export default function ContactPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-5xl px-5 py-28 md:px-8 md:py-36">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to AJN PDF
        </Link>
        <h1 className="mt-8 text-4xl font-black tracking-[-.04em] text-foreground md:text-7xl">Contact AJN PDF</h1>
        <p className="mt-5 max-w-3xl font-medium leading-7 text-muted-foreground">
          Use the official email below for support, privacy, security and copyright requests. AJN PDF does not ask users to email document passwords or confidential files.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {contacts.map((item) => (
            <section key={item.title} className="ajn-theme-surface rounded-[2rem] p-8">
              <item.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-5 text-xl font-black text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              <a href={`mailto:${AJN_BRAND.contactEmail}?subject=${encodeURIComponent(item.subject)}`} className="ajn-primary-button mt-6">
                Email support
              </a>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Official contact</p>
          <a href={`mailto:${AJN_BRAND.contactEmail}`} className="mt-3 block break-all text-2xl font-black md:text-3xl">{AJN_BRAND.contactEmail}</a>
          <p className="mt-4 text-sm text-slate-300">Include screenshots and a small non-confidential sample only when necessary. Remove personal information before sending.</p>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
