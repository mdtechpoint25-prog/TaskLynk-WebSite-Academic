import { Metadata } from 'next';
import { siteConfig, generateMetaTags, generateServiceSchema } from '@/lib/seo-config';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Edit,
  Presentation,
  FileType,
  Settings,
  Calculator,
  PenTool,
  FileCheck,
  ImageIcon,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  ...generateMetaTags(
    'Academic Writing Services - Professional Help with Essays, Research, Data Analysis',
    'Comprehensive academic writing services in Kenya. Expert help with essays, research papers, dissertations, data analysis (SPSS, Excel, R, Python), presentations, editing, and more. Affordable pricing, fast delivery, quality guaranteed.',
    [
      'academic writing services',
      'essay writing help',
      'data analysis services',
      'dissertation writing',
      'SPSS analysis',
      'professional editing services',
      'TaskLynk services',
      'Task Lynk academic',
      'Task Link writing'
    ],
    `${siteConfig.url}/services`
  ),
  ...generateCanonicalMetadata('/services'),
  alternates: {
    canonical: `${siteConfig.url}/services`,
  },
};

const servicesData = [
  {
    category: 'Academic & Writing Services',
    icon: BookOpen,
    color: 'blue',
    services: [
      {
        title: 'Essay Writing',
        description: 'Custom-written academic essays tailored to your requirements. All academic levels from high school to PhD. Plagiarism-free, well-researched content with proper citations.',
        price: 'From KSh 250/page',
        features: ['All academic levels', 'Any citation style', 'Plagiarism report', 'Unlimited revisions']
      },
      {
        title: 'Research Paper Writing',
        description: 'Comprehensive research papers with thorough literature review, methodology, analysis, and conclusions. Expert writers with subject-matter expertise.',
        price: 'From KSh 300/page',
        features: ['Original research', 'Data collection', 'Statistical analysis', 'Professional formatting']
      },
      {
        title: 'Thesis & Dissertation Writing',
        description: 'Complete thesis and dissertation support from proposal to defense. Chapter-by-chapter development with regular feedback.',
        price: 'From KSh 350/page',
        features: ['Proposal writing', 'Literature review', 'Methodology design', 'Results analysis']
      },
      {
        title: 'Assignment Help',
        description: 'Expert assistance with assignments across all subjects. Timely delivery with detailed explanations and working.',
        price: 'From KSh 250/page',
        features: ['All subjects', 'Step-by-step solutions', 'Quick turnaround', 'Quality assured']
      },
      {
        title: 'Case Study Analysis',
        description: 'In-depth case study analysis with practical recommendations. Industry-specific insights and professional presentation.',
        price: 'From KSh 300/page',
        features: ['Industry research', 'SWOT analysis', 'Recommendations', 'Executive summary']
      },
      {
        title: 'Lab Report Writing',
        description: 'Scientific lab reports with proper methodology, data presentation, and analysis. Accurate technical writing.',
        price: 'From KSh 250/page',
        features: ['Scientific accuracy', 'Data visualization', 'Proper formatting', 'Clear conclusions']
      }
    ]
  },
  {
    category: 'Data Analysis Services',
    icon: Calculator,
    color: 'green',
    services: [
      {
        title: 'SPSS Analysis',
        description: 'Professional statistical analysis using SPSS. Descriptive statistics, regression, ANOVA, factor analysis, and more.',
        price: 'From KSh 350/dataset',
        features: ['All statistical tests', 'Interpretation report', 'APA tables', 'Data cleaning']
      },
      {
        title: 'Excel Data Analysis',
        description: 'Advanced Excel analysis with pivot tables, charts, formulas, and data visualization. Business intelligence solutions.',
        price: 'From KSh 300/dataset',
        features: ['Advanced formulas', 'Pivot tables', 'Charts & graphs', 'Automation']
      },
      {
        title: 'R Programming',
        description: 'Statistical computing with R. Data manipulation, visualization (ggplot2), and statistical modeling.',
        price: 'From KSh 400/project',
        features: ['Data wrangling', 'ggplot2 visualization', 'Statistical models', 'R Markdown reports']
      },
      {
        title: 'Python Data Analysis',
        description: 'Python-based data analysis using pandas, numpy, matplotlib, and scikit-learn. Machine learning integration.',
        price: 'From KSh 400/project',
        features: ['Pandas & NumPy', 'Data visualization', 'ML models', 'Jupyter notebooks']
      },
      {
        title: 'STATA Analysis',
        description: 'Econometric and statistical analysis using STATA. Panel data, time series, and regression analysis.',
        price: 'From KSh 350/dataset',
        features: ['Regression analysis', 'Panel data', 'Time series', 'Custom do-files']
      },
      {
        title: 'JASP & JAMOVI',
        description: 'User-friendly statistical analysis with JASP and JAMOVI. Perfect for researchers new to statistics.',
        price: 'From KSh 300/dataset',
        features: ['Easy interpretation', 'Visual output', 'Bayesian analysis', 'Report generation']
      }
    ]
  },
  {
    category: 'Editing & Quality Services',
    icon: Edit,
    color: 'purple',
    services: [
      {
        title: 'Grammar & Proofreading',
        description: 'Professional proofreading with Grammarly Premium. Comprehensive grammar, spelling, punctuation, and style corrections.',
        price: 'KSh 30/page',
        features: ['Grammarly Premium', 'Style improvement', 'Clarity enhancement', 'Fast turnaround']
      },
      {
        title: 'Plagiarism Detection Report',
        description: 'Comprehensive plagiarism and AI detection reports using Turnitin, Copyscape, and GPTZero.',
        price: 'KSh 30/document',
        features: ['Multiple tools', 'Detailed report', 'Similarity score', 'AI detection']
      },
      {
        title: 'Formatting & Referencing',
        description: 'Professional formatting and citation services. APA, MLA, Harvard, Chicago, and other styles.',
        price: 'KSh 25/page',
        features: ['All citation styles', 'In-text citations', 'Reference list', 'Proper formatting']
      }
    ]
  },
  {
    category: 'Presentation & Design',
    icon: Presentation,
    color: 'orange',
    services: [
      {
        title: 'PowerPoint Design',
        description: 'Professional PowerPoint presentations with custom designs, animations, and visual appeal.',
        price: 'From KSh 150/slide',
        features: ['Custom templates', 'Animations', 'Visual graphics', 'Speaker notes']
      },
      {
        title: 'Infographic Design',
        description: 'Eye-catching infographics for reports, presentations, and social media. Data visualization expertise.',
        price: 'From KSh 150/graphic',
        features: ['Custom design', 'Data visualization', 'High resolution', 'Editable files']
      },
      {
        title: 'Resume & CV Design',
        description: 'Professional resume and CV design optimized for ATS systems. Stand out in job applications.',
        price: 'From KSh 200',
        features: ['ATS-friendly', 'Modern design', 'Multiple formats', '2 revisions']
      },
      {
        title: 'Poster & Brochure Design',
        description: 'Academic and business posters, brochures, and flyers. Professional design with brand consistency.',
        price: 'From KSh 200',
        features: ['Print-ready', 'High resolution', 'Custom branding', 'Multiple sizes']
      }
    ]
  },
  {
    category: 'Document Services',
    icon: FileType,
    color: 'indigo',
    services: [
      {
        title: 'PDF Editing',
        description: 'Edit, merge, split, and modify PDF documents. Text editing, image insertion, and layout adjustments.',
        price: 'KSh 50/page',
        features: ['Text editing', 'Image insertion', 'Merge/split', 'Form filling']
      },
      {
        title: 'Document Conversion',
        description: 'Convert documents between formats (Word, PDF, Excel, PowerPoint) while preserving formatting.',
        price: 'KSh 10/file',
        features: ['All formats', 'Format preservation', 'Quality maintained', 'Fast delivery']
      },
      {
        title: 'File Compression',
        description: 'Reduce file sizes for easy sharing and storage. Maintain quality while optimizing size.',
        price: 'KSh 20/file',
        features: ['Quality preserved', 'Multiple formats', 'Batch processing', 'Quick turnaround']
      }
    ]
  },
  {
    category: 'Premium Add-ons',
    icon: Zap,
    color: 'red',
    services: [
      {
        title: 'Fast Delivery (Urgent)',
        description: 'Express delivery within 4-12 hours depending on scope. Priority queue with dedicated writers.',
        price: '+30% of total',
        features: ['4-12 hour delivery', 'Priority handling', 'Dedicated writer', 'Quality maintained']
      },
      {
        title: 'Revision Support',
        description: 'Comprehensive revision support based on client feedback. Ensure complete satisfaction.',
        price: 'First revision free, KSh 100 thereafter',
        features: ['Unlimited changes', 'Quick turnaround', 'Quality focus', 'Client satisfaction']
      },
      {
        title: 'Expert Consultation',
        description: 'One-on-one consultation with subject matter experts. Research guidance and problem-solving.',
        price: 'KSh 500/hour',
        features: ['Expert guidance', 'Live sessions', 'Personalized help', 'Follow-up support']
      },
      {
        title: 'Online Tutoring',
        description: 'Personalized tutoring sessions for academic subjects. Improve understanding and grades.',
        price: 'KSh 500/hour',
        features: ['All subjects', 'Flexible schedule', 'Interactive sessions', 'Study materials']
      }
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced SEO-rich header with Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TaskLynk Academic",
            "alternateName": ["TaskLynk", "Task Lynk", "Task Link", "TaskLynk Academic Services"],
            "url": siteConfig.url,
            "logo": `${siteConfig.url}/logo.png`,
            "description": siteConfig.description,
            "email": siteConfig.contact.email,
            "telephone": siteConfig.contact.phone,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Nairobi",
              "addressCountry": "Kenya"
            },
            "sameAs": [siteConfig.url],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Academic Writing Services",
              "itemListElement": servicesData.map(category => ({
                "@type": "OfferCatalog",
                "name": category.category,
                "itemListElement": category.services.map(service => ({
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": service.title,
                    "description": service.description
                  }
                }))
              }))
            }
          })
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateServiceSchema(
              'Academic Writing Services',
              'Professional academic writing services including essays, research papers, dissertations, and thesis writing. Expert writers with subject-matter expertise across all academic levels. Available through TaskLynk, Task Lynk, and Task Link platforms.'
            ),
            generateServiceSchema(
              'Data Analysis Services',
              'Statistical data analysis services using SPSS, Excel, R, Python, STATA, JASP, and JAMOVI. Comprehensive analysis with interpretation and visualization offered by TaskLynk Academic.'
            ),
            generateServiceSchema(
              'Editing and Proofreading Services',
              'Professional editing and proofreading services including grammar checking, plagiarism detection, and formatting services provided by Task Lynk professionals.'
            )
          ])
        }}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        {/* background image with subtle royal-blue overlay */}
        <div className="absolute inset-0 -z-10">
          <img
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/4725524a-2f4b-4f7d-b833-8bc3a28db642/generated_images/professional-workspace-with-laptop-writi-a3244739-20251030002541.jpg"
            alt="TaskLynk Academic Services - Professional Writing Workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(26,35,126,0.25),rgba(26,35,126,0.15))]" />
        </div>
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Professional Academic Writing Services in Kenya | TaskLynk
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Comprehensive solutions for all your academic and professional needs from TaskLynk (Task Lynk / Task Link). 
                Expert writers, data analysts, and designers ready to help you succeed.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                🎓 Essays • Research Papers • Dissertations • Data Analysis (SPSS, R, Python) • PowerPoint • Editing
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="btn btn-secondary uppercase">Get Started Today</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        {/* SEO-rich intro text */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-muted-foreground">
            Welcome to <strong>TaskLynk Academic</strong> (also known as <strong>Task Lynk</strong> and <strong>Task Link</strong>) - 
            Kenya's leading academic writing and research support platform. We provide comprehensive services for students, 
            researchers, and professionals across all academic levels.
          </p>
        </div>

        {servicesData.map((category, idx) => (
          <div key={idx} className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className={`bg-${category.color}-500/10 p-3 rounded-xl`}>
                <category.icon className={`w-8 h-8 text-${category.color}-600`} />
              </div>
              <h2 className="text-3xl font-bold">{category.category}</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.services.map((service, serviceIdx) => (
                <article 
                  key={serviceIdx}
                  className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105"
                  itemScope
                  itemType="https://schema.org/Service"
                >
                  <h3 className="text-xl font-semibold mb-3" itemProp="name">{service.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed" itemProp="description">
                    {service.description}
                  </p>
                  <div className="text-2xl font-bold text-primary mb-4" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price">{service.price}</span>
                  </div>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary to-secondary py-16">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Professional Help from TaskLynk?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust TaskLynk (Task Lynk / Task Link) for their academic and professional needs
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Create Your Account Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced FAQ Schema with brand variations */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is TaskLynk (Task Lynk / Task Link)?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "TaskLynk (also known as Task Lynk and Task Link) is Kenya's leading academic writing and research support platform. We provide comprehensive services including essay writing, research papers, dissertations, data analysis, and more for students and professionals."
                }
              },
              {
                "@type": "Question",
                "name": "What academic writing services does TaskLynk offer?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "TaskLynk offers comprehensive academic writing services including essays, research papers, dissertations, thesis writing, assignments, case studies, lab reports, and more. All services are provided by expert writers with subject-matter expertise."
                }
              },
              {
                "@type": "Question",
                "name": "Does Task Lynk provide data analysis services?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Task Lynk provides professional data analysis services using SPSS, Excel, R Programming, Python, STATA, JASP, and JAMOVI. Our services include statistical analysis, data visualization, and comprehensive interpretation reports."
                }
              },
              {
                "@type": "Question",
                "name": "How much does essay writing cost at Task Link?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "At Task Link (TaskLynk), essay writing services start from KSh 250 per page. PowerPoint slides start from KSh 150 per slide. Prices vary based on academic level, urgency, and complexity. We offer transparent pricing with no hidden fees."
                }
              },
              {
                "@type": "Question",
                "name": "Does TaskLynk offer revision support?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, TaskLynk offers comprehensive revision support. The first revision is free, and subsequent revisions are KSh 100 each. We ensure complete client satisfaction with unlimited changes."
                }
              },
              {
                "@type": "Question",
                "name": "Is TaskLynk available in Kenya?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, TaskLynk (Task Lynk / Task Link) is based in Kenya and serves students and professionals throughout Nairobi, Mombasa, and all Kenyan cities. We offer 24/7 support and fast delivery for all academic services."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}