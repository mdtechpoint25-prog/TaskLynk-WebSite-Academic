import Link from 'next/link';
import Image from 'next/image';

export const Footer = () => {
  return (
    <footer className="bg-[#0B1222] text-white py-8 mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between gap-6 text-xs sm:text-sm whitespace-nowrap overflow-x-auto">
          {/* Brand + Copyright */}
          <div className="flex items-center gap-4 shrink-0">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1762897197877.png?width=8000&height=8000&resize=contain"
              alt="TaskLynk Logo"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <p className="opacity-80">© 2025 TaskLynk. All Rights Reserved. M&D TechPoint.</p>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-6 shrink-0">
            <Link 
              href="/terms" 
              className="text-white/80 hover:text-secondary transition-colors underline-offset-4 hover:underline"
            >
              Terms & Conditions
            </Link>
            <Link 
              href="/terms" 
              className="text-white/80 hover:text-secondary transition-colors underline-offset-4 hover:underline"
            >
              Company Policy
            </Link>
            <Link 
              href="/privacy" 
              className="text-white/80 hover:text-secondary transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};