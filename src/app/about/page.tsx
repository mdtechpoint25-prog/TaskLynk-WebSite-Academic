import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Users, Shield, DollarSign, Star, FileText, Clock, BookOpen, PenTool, Calculator, Presentation, Award } from 'lucide-react';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';

export const metadata: Metadata = {
  title: 'About TaskLynk - Academic Writing Marketplace',
  description: 'TaskLynk is a professional academic writing marketplace that bridges clients and verified freelancers with admin-supervised workflows, secure payments, and quality delivery.',
  ...generateCanonicalMetadata('/about')
};

export default function AboutPage() {
  return (
    <section className="relative">
      {/* Hero / Header */}
      <div className="relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/professional-workspace-with-laptop-writi-a3244739-20251030002541.jpg"
            alt="About TaskLynk"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,35,126,0.35),rgba(26,35,126,0.15))]" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 pt-28 md:pt-32 pb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About TaskLynk</h1>
          <p className="max-w-3xl opacity-95">
            TaskLynk is a professional academic writing marketplace that bridges the gap between clients and verified freelancers. We provide a secure, transparent, and efficient platform for academic projects, research assistance, editing, and professional writing services.
          </p>
        </div>
        {/* Wave divider */}
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-[80px] text-[#1A237E]/50">
          <path d="M0,64 C 360,120 1080,0 1440,64 L1440,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      {/* About Copy */}
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">TaskLynk</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>
                Our workflow is supervised by experienced administrators to ensure fairness, originality, and timely delivery on every order. Whether you're a student seeking help with a paper or a writer offering expertise, TaskLynk provides a trusted space for collaboration and excellence.
              </p>
              <p>
                With our automated order tracking, transparent communication, and secure payment system, we make it easy for clients and freelancers to focus on quality work while we handle the process in the background.
              </p>
              <p>
                Join TaskLynk today — where academic quality meets professionalism.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Fast facts</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-secondary" /> Admin-supervised workflow</li>
                  <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Verified freelancers</li>
                  <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Secure transactions</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Timely delivery</li>
                </ul>
              </div>
              <div className="bg-muted/40 text-muted-foreground text-xs px-6 py-3 border-t border-border">
                TaskLynk - Linking Talent. Delivering Results.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Process */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 -z-10">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1762902270820.png?width=1600&height=1600&resize=contain"
            alt="Decorative lines background"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">A Seamless Experience from Start to Finish</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">TaskLynk simplifies academic outsourcing into three easy steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[{
              icon: FileText, title: 'Post your project', text: 'Post your project with clear requirements.'
            },{
              icon: Users, title: 'Receive verified bids', text: 'Receive bids from verified freelancers.'
            },{
              icon: CheckCircle, title: 'Approve & track', text: 'Approve the best proposal and track progress in real-time.'
            }].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">Every step is monitored to ensure integrity and satisfaction.</p>
        </div>
      </div>

      {/* Our Advantages */}
      <div className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Why Choose TaskLynk?</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Shield, title: 'Admin-supervised workflow', color: 'text-red-600' },
              { icon: Users, title: 'Verified & skilled freelancers', color: 'text-purple-600' },
              { icon: DollarSign, title: 'Fair pricing & secure transactions', color: 'text-green-600' },
              { icon: CheckCircle, title: 'Fast dispute resolution', color: 'text-blue-600' },
              { icon: Star, title: 'Consistent quality ratings', color: 'text-amber-600' },
              { icon: Award, title: 'Admin-assigned performance badges', color: 'text-indigo-600' },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className={`w-12 h-12 rounded-lg bg-muted/60 flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <p className="font-semibold">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What We Offer */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Comprehensive Academic & Professional Services</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">From research and writing to editing, data analysis, and presentations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Academic Writing & Research' },
              { icon: PenTool, title: 'Editing & Proofreading' },
              { icon: Calculator, title: 'Data Analysis & Presentations' },
              { icon: Presentation, title: 'Proposal & Dissertation Support' },
              { icon: FileText, title: 'Business & Technical Writing' },
              { icon: Star, title: 'And more…' },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Trusted by Thousands of Clients and Writers</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Discover how TaskLynk has helped students and professionals achieve excellence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Sarah M.', role: 'University Student', text: 'Exceptional quality and timely delivery for my thesis. Highly recommended.' },
              { name: 'David K.', role: 'Freelance Writer', text: 'Fair payment system and transparent process. Consistent work availability.' },
              { name: 'Dr. Jane O.', role: 'Research Consultant', text: 'SPSS analysis delivered with detailed interpretation within 48 hours.' },
            ].map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 md:py-24 text-primary-foreground bg-[linear-gradient(100deg,rgba(26,35,126,0.55),rgba(26,35,126,0.35))]">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to join TaskLynk?</h3>
          <p className="opacity-90 max-w-2xl mx-auto mb-6">Create your account and experience reliable, admin-supervised academic services today.</p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="btn btn-secondary uppercase">Create Account</Link>
            <Link href="/services" className="btn btn-primary uppercase">Explore Services</Link>
          </div>
        </div>
      </div>
    </section>
  );
}