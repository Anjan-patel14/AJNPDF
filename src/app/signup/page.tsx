import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { AuthPanel } from '@/components/account/auth-panel';

export const metadata: Metadata = { title: { absolute: 'Create AJN Account | AJN PDF' }, robots: { index: false, follow: true } };

export default function SignupPage(){return <div className="min-h-screen bg-slate-50"><Navbar/><main className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-[100px] md:grid-cols-[1fr_430px] md:px-8 md:pt-[120px]"><section className="self-center"><p className="text-[10px] font-black uppercase tracking-[.24em] text-violet-700">AJN Account</p><h1 className="mt-4 max-w-2xl text-4xl font-black tracking-[-.05em] text-slate-950 md:text-6xl">Create your AJN account.</h1><p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600 md:text-base">Use one account for Premium entitlement, AJN API, desktop/mobile releases and future signing workflows. Your PDF content is not stored in the account profile by default.</p></section><AuthPanel mode="signup"/></main><MainFooter/></div>}
