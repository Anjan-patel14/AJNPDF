import Link from 'next/link';
import { ArrowRight, CircleHelp, Mail } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';

const groups = [
  {
    title: 'Processing and privacy',
    items: [
      {
        q: 'How does AJN PDF handle files?',
        a: 'File handling depends on the workflow. Each tool provides practical handling details, limits and result steps before you begin.',
      },
      {
        q: 'Which tools use an online workflow?',
        a: 'Advanced conversion, protection, unlocking and repair workflows may temporarily upload the selected file when an additional conversion engine is required.',
      },
      {
        q: 'Are temporary files deleted?',
        a: 'Online requests use an isolated temporary work area that is scheduled for cleanup after the result is delivered. On-device tools keep their working state in the active page.',
      }],
  },
  {
    title: 'Tools and limits',
    items: [
      {
        q: 'Are all conversions exact?',
        a: 'No. Complex layouts, fonts, scans, charts and browser limitations can change output. Limited tools show their known constraints and important results should be reviewed.',
      },
      {
        q: 'What file-size limits apply?',
        a: 'Limits depend on the tool, file type and active processing service. The current limits page documents the policy, while each workflow enforces safety requirements automatically and shows an actionable error only when needed.',
      },
      {
        q: 'Do public tools require an account?',
        a: 'No account is required for the current public tool directory. Prototype account and dashboard surfaces are not part of this release.',
      }],
  },
  {
    title: 'Security and authorization',
    items: [
      {
        q: 'Can AJN PDF guess or recover a forgotten PDF password?',
        a: 'No. Unlock PDF requires the current valid password and confirmation that you own the file or have permission to remove its protection.',
      },
      {
        q: 'What encryption does Protect PDF use?',
        a: 'Protect PDF uses pikepdf encryption revision 6 with AES enabled. Permission settings are applied through the native PDF engine.',
      },
      {
        q: 'Does AJN PDF claim external security certification?',
        a: 'No external badge, audit grade or uptime score is claimed unless it can be independently verified and linked from the relevant page.',
      }],
  },
  {
    title: 'Advertisements',
    items: [
      {
        q: 'Why are ads placed below tool content?',
        a: 'Advertisements are separated from upload, process and download controls to reduce confusion and accidental interaction.',
      },
      {
        q: 'Why might an ad not display?',
        a: 'AdSense review status, inventory, ad blockers, regional consent requirements or the user’s advertising choice can prevent rendering.',
      },
      {
        q: 'Can I change my advertising choice?',
        a: 'Yes. Use the Privacy choices button in the footer. Regional Google-certified consent messages must also be configured in the publisher’s AdSense account where required.',
      }],
  }];

export default function FAQPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mx-auto max-w-4xl text-center">
          <span className="ajn-section-kicker"><CircleHelp className="h-3.5 w-3.5" /> Help centre</span>
          <h1 className="mt-6 text-5xl font-black tracking-[-.05em] text-foreground md:text-7xl">Answers for common AJN PDF workflows.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground">Find clear guidance about file handling, limits, downloads, security and the current public toolset.</p>
        </div>

        <div className="mt-16 space-y-14">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="flex items-center gap-3 border-b border-border pb-4"><span className="h-2.5 w-1.5 rounded-sm bg-blue-600" /><h2 className="text-xl font-black text-foreground">{group.title}</h2></div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {group.items.map((item) => <article key={item.q} className="ajn-glass-card rounded-3xl p-6"><h3 className="text-base font-black text-foreground">{item.q}</h3><p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{item.a}</p></article>)}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-7 text-slate-950 shadow-[0_22px_60px_rgba(37,62,113,.08)] md:flex-row md:items-center md:p-9">
          <div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Mail className="h-5 w-5" /></span><div><h2 className="text-xl font-black">Need help with a specific tool?</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-600">Include the tool name, browser, file type, approximate size and the visible error. Do not send confidential files unless support explicitly requests a safe reproduction.</p></div></div>
          <Link href="/contact" className="inline-flex h-11 shrink-0 items-center rounded-xl bg-blue-600 px-5 text-xs font-black text-white hover:bg-blue-700">Contact AJN PDF <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
