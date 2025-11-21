import type { Metadata } from 'next'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, 
  Users, 
  DollarSign, 
  Star, 
  Shield, 
  MessageSquare, 
  CheckCircle,
  Award,
  BookOpen,
  PenTool,
  Presentation,
  Calculator,
  Edit,
  FileCheck,
  Clock,
  BadgeCheck,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Zap,
  TrendingUp,
  UserCheck,
  FileType,
  Target,
  Repeat
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'TaskLynk — Get Your Assignments Managed by Expert Writers, Certified Editors & Professional Managers',
  description: 'Submit any academic or business task and get a fully managed experience from start to finish. Professional writers, expert editors, and dedicated managers ensure quality work every time.',
  keywords: 'academic writing services Kenya, essay writing, research papers, expert editors, professional managers, urgent orders, technical writing, SPSS analysis, data analysis, assignment help',
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />

      {/* Hero Section - EssayPro Style with Layered Backgrounds */}
      <section className="relative pt-24 md:pt-28 pb-16 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/50">
        {/* Layer 1: Fifth image (flowing waves) - Main decorative background */}
        <div 
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1763528379047.png?width=8000&height=8000&resize=contain)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'multiply'
          }}
        />
        
        {/* Layer 2: Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>

        {/* Soft gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 dark:bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-full px-3 py-1.5 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Trusted by 1000+ Students & Professionals</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-foreground">
                Get Your Assignments Managed by <span className="text-primary">Expert Writers & Certified Editors</span>
              </h1>
              
              <p className="text-base md:text-lg mb-6 text-muted-foreground leading-relaxed">
                Submit any academic or business task and get a fully managed experience from start to finish with professional quality guaranteed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button asChild size="lg" className="btn btn-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/register">
                    Order Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-sm font-semibold border-2">
                  <Link href="#contact">
                    <Phone className="mr-2 w-4 h-4" />
                    24/7 Support
                  </Link>
                </Button>
              </div>

              {/* Quick Contact */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <a href="tel:+254701066845" className="hover:text-primary transition-colors font-medium">
                    +254 701 066 845
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <a href="mailto:tasklynk01@gmail.com" className="hover:text-primary transition-colors font-medium">
                    tasklynk01@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/professional-academic-student-studying-w-4dfb4375-20251119034936.jpg"
                  alt="Professional academic writing services"
                  width={800}
                  height={450}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Our System Works - 4 Steps with Background Layer */}
      <section className="relative py-16 md:py-20 bg-background overflow-hidden">
        {/* Layer: First image (curved circles) */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1763528080360.png?width=8000&height=8000&resize=contain)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-primary uppercase">Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">How Our System Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A 4-step visual process from submission to download
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                number: "1",
                icon: FileText,
                title: "Submit Order Instructions",
                description: "Upload your assignment details, files, deadline, and requirements. Set your budget (min KSh 250/page, 150/slide)."
              },
              {
                number: "2",
                icon: UserCheck,
                title: "Manager Assigns Best Writer",
                description: "Your dedicated manager reviews your order and assigns the most qualified writer based on expertise and track record."
              },
              {
                number: "3",
                icon: FileCheck,
                title: "Editor Checks Quality & Originality",
                description: "Expert editor reviews grammar, structure, coherence, formatting, AI score, plagiarism, and academic tone."
              },
              {
                number: "4",
                icon: CheckCircle,
                title: "Download Final Polished Work",
                description: "Receive journal-quality work. Approve and download your completed assignment with confidence."
              }
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  {step.number}
                </div>
                <div className="bg-primary/5 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different - New Services with Background Layer */}
      <section className="relative py-20 bg-muted/30 overflow-hidden">
        {/* Layer: Third image (horizontal wavy lines) */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1763528124051.png?width=8000&height=8000&resize=contain)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'soft-light'
          }}
        />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-secondary uppercase">Our Advantages</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">What Makes Us Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry-leading services that guarantee your success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Dedicated Managers */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="mb-6 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/clean-flat-style-illustration-of-a-profe-7ce1eb69-20251119034206.jpg"
                  alt="Dedicated manager organizing tasks"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Dedicated Managers Assigned to You</h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Every client gets a personal manager who:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Monitors your orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Chooses the best writer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tracks deadlines</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Communicates progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Ensures quality before submission</span>
                </li>
              </ul>
              <p className="text-sm italic text-primary mt-4 font-medium">
                "Think of your manager as your academic project supervisor — but available 24/7."
              </p>
            </div>

            {/* Professional Editors */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="mb-6 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/clean-flat-illustration-of-editors-revie-1681dffd-20251119034206.jpg"
                  alt="Professional editors reviewing documents"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500/10 p-3 rounded-lg">
                  <FileCheck className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">Professional Editors (Human Review)</h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                All orders go through an expert editor who checks:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Grammar & spelling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Structure & coherence</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>APA/MLA formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>AI score verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Plagiarism check</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Academic tone</span>
                </li>
              </ul>
              <p className="text-sm italic text-primary mt-4 font-medium">
                This guarantees journal-quality work.
              </p>
            </div>

            {/* Technical Order Handling */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="mb-6 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/professional-flat-style-illustration-of--11256a93-20251119034206.jpg"
                  alt="Professionals working on technical assignments"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Technical Order Handling</h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                We have specialists in:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Statistics</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Engineering</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Nursing</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Law</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Economics</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Programming</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Accounting</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>SPSS, R, Python</span>
                </div>
              </div>
              <p className="text-sm italic text-primary font-medium">
                "Your technical orders are handled by professionals with real field experience."
              </p>
            </div>

            {/* Urgent Orders */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="mb-6 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/minimal-flat-illustration-of-a-clock-and-63d36a65-20251119034208.jpg"
                  alt="Urgent order delivery illustration"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Urgent Orders (Minimum 3 Hours)</h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                We support:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-medium">3 hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-medium">6 hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-medium">12 hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Overnight</span>
                </li>
              </ul>
              <p className="text-sm italic text-primary font-medium">
                "Need a paper in 3 hours? Our rapid-response team handles urgent deadlines without compromising quality."
              </p>
            </div>

            {/* Unlimited Revisions */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-cyan-500/10 p-3 rounded-lg">
                  <Repeat className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold">Unlimited Revisions</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Until satisfied — handled by editors and managers. We don't stop until you're 100% happy with the final result. All revision requests are professionally managed.
              </p>
            </div>

            {/* 24/7 Live Support */}
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500/10 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold">24/7 Live Support</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Human response in under 5 minutes, not bots. Real people ready to help you anytime, day or night.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a href="tel:+254701066845" className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">+254 701 066 845</span>
                </a>
                <a href="mailto:tasklynk01@gmail.com" className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">tasklynk01@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Expanded with Background Layer */}
      <section className="relative py-20 bg-background overflow-hidden">
        {/* Layer: Second image (dotted pattern) */}
        <div 
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1763528106135.png?width=8000&height=8000&resize=contain)',
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-primary uppercase">What We Offer</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive academic and professional writing services
            </p>
          </div>

          {/* Academic Writing */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">Academic Writing</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Essays', price: '250' },
                { name: 'Research Papers', price: '300' },
                { name: 'Lab Reports', price: '250' },
                { name: 'Case Studies', price: '300' },
                { name: 'Discussion Posts', price: '250' },
                { name: 'Literature Reviews', price: '300' },
                { name: 'Reports', price: '250' },
                { name: 'Thesis Help', price: '350' },
                { name: 'Reflective Writing', price: '250' },
                { name: 'SOP & Admission Essays', price: '300' }
              ].map((service, index) => (
                <div key={index} className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <PenTool className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">From <span className="text-lg font-bold text-secondary">KSh {service.price}</span>/page</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Services */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">Business Services</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Business Reports', price: '300' },
                { name: 'Presentations', price: '150', unit: 'slide' },
                { name: 'Marketing Plans', price: '350' },
                { name: 'Business Proposals', price: '300' },
                { name: 'CV & Resume Writing', price: '250' },
                { name: 'Company Profiles', price: '300' },
                { name: 'Product Descriptions', price: '250' }
              ].map((service, index) => (
                <div key={index} className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Presentation className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">From <span className="text-lg font-bold text-blue-600">KSh {service.price}</span>/{service.unit || 'page'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Services */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">Technical Services</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Coding Assignments', price: '400' },
                { name: 'Data Analysis', price: '350' },
                { name: 'SPSS / R Projects', price: '350' },
                { name: 'Nursing Simulations', price: '300' },
                { name: 'Engineering Problem Sets', price: '400' },
                { name: 'Python Data Analysis', price: '400' },
                { name: 'Excel Analysis', price: '300' },
                { name: 'STATA Analysis', price: '350' }
              ].map((service, index) => (
                <div key={index} className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Calculator className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">From <span className="text-lg font-bold text-green-600">KSh {service.price}</span>/project</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="btn btn-secondary text-base font-semibold">
              <Link href="/services">
                View All Services
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety & Guarantees */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-500/10 rounded-full px-4 py-2 mb-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600 uppercase">Safety & Guarantees</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Your Work is Protected</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: CheckCircle, title: '100% Original Work', color: 'text-green-600' },
              { icon: Shield, title: 'AI Detection Passed', color: 'text-blue-600' },
              { icon: FileCheck, title: 'Turnitin-safe', color: 'text-purple-600' },
              { icon: BadgeCheck, title: 'Confidential & Secure', color: 'text-indigo-600' },
              { icon: DollarSign, title: 'Money-back Guarantee', color: 'text-amber-600' },
              { icon: UserCheck, title: 'Verified Human Editors', color: 'text-cyan-600' }
            ].map((item, index) => (
              <div key={index} className="bg-card p-8 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className={`w-16 h-16 rounded-full bg-${item.color}/10 flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials + Writer Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 rounded-full px-4 py-2 mb-4">
              <Star className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-600 uppercase">Success Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">What Our Users Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {[
              {
                name: "Sarah M.",
                role: "University Student",
                content: "TaskLynk helped me complete my thesis with exceptional quality. The dedicated manager and editor made everything stress-free!",
                rating: 5,
                badge: "Verified Client"
              },
              {
                name: "David K.",
                role: "Freelance Writer",
                content: "Fair payments and transparent process. TaskLynk is my main source of income with consistent quality work.",
                rating: 5,
                badge: "Top Writer 2024"
              },
              {
                name: "Dr. Jane O.",
                role: "Research Consultant",
                content: "The SPSS analysis was delivered with full interpretation within 48 hours. Professional and highly recommended!",
                rating: 5,
                badge: "Expert Editor"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-card p-8 rounded-xl shadow-sm border border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="bg-secondary/10 px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold text-secondary">{testimonial.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Writer Badges */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Our Top-Rated Professionals</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: 'Top Writer 2024', icon: Award },
                { label: 'Expert Editor', icon: FileCheck },
                { label: 'Fast Responder', icon: Zap },
                { label: 'Technical Specialist', icon: Target }
              ].map((badge, index) => (
                <div key={index} className="bg-card border-2 border-secondary px-6 py-3 rounded-full flex items-center gap-2 shadow-sm">
                  <badge.icon className="w-5 h-5 text-secondary" />
                  <span className="font-semibold">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-primary uppercase">FAQs</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: "How do you ensure originality?",
                a: "Every paper goes through professional editors who check with advanced plagiarism tools (Turnitin) and AI detection software. We guarantee 100% original, human-written content."
              },
              {
                q: "How fast can you deliver?",
                a: "We handle urgent orders with minimum 3-hour turnaround. Standard orders follow your specified deadline. Our rapid-response team ensures quality even on tight schedules."
              },
              {
                q: "Can I communicate with my writer?",
                a: "Yes! You can message your assigned writer directly through our secure platform. Your manager also coordinates communication and ensures progress updates."
              },
              {
                q: "What if I want revisions?",
                a: "Unlimited revisions are included until you're satisfied. Simply request changes through your manager, and our editors will ensure quality improvements."
              },
              {
                q: "Are managers real people?",
                a: "Absolutely! Every client is assigned a dedicated human manager (not a bot) who personally oversees your order from start to finish, available 24/7."
              },
              {
                q: "What subjects do you cover?",
                a: "We cover all academic subjects including technical fields like Statistics, Engineering, Nursing, Law, Economics, Programming, Accounting, and specialized data analysis (SPSS, R, Python)."
              }
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <h4 className="font-bold text-lg mb-3 text-primary">{item.q}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border border-secondary/30 rounded-full px-4 py-2 mb-6">
              <Phone className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary">CALL NOW: +254 701 066 845</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Fast response. Human support 24/7. Join thousands of satisfied clients today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild size="lg" className="btn btn-secondary text-base font-semibold">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white text-base font-semibold">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col md:flex-row justify-center gap-6 text-sm opacity-90">
              <a href="tel:+254701066845" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+254 701 066 845</span>
              </a>
              <a href="tel:+254702794172" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+254 702 794 172</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Keywords Section */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <h3 className="text-xl font-bold mb-4">Your Trusted Academic Writing Marketplace in Kenya & Beyond</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-4xl leading-relaxed">
            TaskLynk connects clients with verified academic writers, technical experts, editors, and personal managers through a secure, admin-supervised system. Get high-quality academic papers, data analysis, urgent orders, and technical assignments delivered professionally.
          </p>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-primary">Popular Services (Starter Prices):</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>• Essay Writing — from KSh 250/page</div>
              <div>• Research Papers — from KSh 300/page</div>
              <div>• Dissertations/Thesis — from KSh 350/page</div>
              <div>• SPSS Data Analysis — from KSh 350/dataset</div>
              <div>• Excel Analysis — from KSh 300/dataset</div>
              <div>• R Programming — from KSh 400/project</div>
              <div>• Python Data Analysis — from KSh 400/project</div>
              <div>• Assignment Help — from KSh 250/page</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-primary">SEO Keywords:</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              academic writing services Kenya, essay writing service, research paper help, thesis writing Kenya, online assignments Kenya, freelance writers Kenya, SPSS analysis Kenya, data analysis help Kenya, urgent academic writing 3 hours, verified Kenyan writers, TaskLynk academic help, best writing platform Kenya, freelance academic jobs Kenya, assignment help Nairobi, APA MLA Harvard Chicago formatting, plagiarism-free writing, AI detection passed, Turnitin safe papers, professional editors Kenya, dedicated academic managers
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1222] text-white py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1762897197877.png?width=8000&height=8000&resize=contain"
                alt="TaskLynk Logo"
                width={180}
                height={60}
                className="h-12 w-auto object-contain mb-6"
              />
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                TaskLynk — Linking Talent. Delivering Results.
              </p>
              <p className="text-sm text-white/80">
                Professional Academic Writing Platform
              </p>
            </div>
            
            {/* Services */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-sm tracking-wide">Services</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/services" className="hover:text-secondary transition-colors">Academic Writing</Link></li>
                <li><Link href="/services" className="hover:text-secondary transition-colors">Business Services</Link></li>
                <li><Link href="/services" className="hover:text-secondary transition-colors">Technical Services</Link></li>
                <li><Link href="/services" className="hover:text-secondary transition-colors">Data Analysis</Link></li>
              </ul>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-sm tracking-wide">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/" className="hover:text-secondary transition-colors">Home</Link></li>
                <li><Link href="/about" className="hover:text-secondary transition-colors">How It Works</Link></li>
                <li><Link href="/register" className="hover:text-secondary transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-sm tracking-wide">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 text-white/80">
                  <Phone className="w-4 h-4 mt-1" />
                  <div>
                    <p className="font-semibold text-white mb-1">Phone</p>
                    <a href="tel:+254701066845" className="hover:text-secondary transition-colors block">
                      +254 701 066 845
                    </a>
                    <a href="tel:+254702794172" className="hover:text-secondary transition-colors block">
                      +254 702 794 172
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <Mail className="w-4 h-4 mt-1" />
                  <div>
                    <p className="font-semibold text-white mb-1">Email</p>
                    <a href="mailto:tasklynk01@gmail.com" className="hover:text-secondary transition-colors block">
                      tasklynk01@gmail.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/70">
              <p>© 2025 TaskLynk. All Rights Reserved. M&D TechPoint.</p>
              <p>Professional Academic Writing Marketplace</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}