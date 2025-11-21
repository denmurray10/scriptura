import { Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="w-full border-t border-white/10 mt-20 p-8 text-muted-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Logo and description */}
        <div className="space-y-4 lg:col-span-1">
          <Logo />
          <p className="text-sm">
            The world’s first and largest digital marketplace for AI-driven
            narratives and interactive stories.
          </p>
        </div>

        {/* Column 2: Marketplace Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground font-headline">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            <li><Link href="/characters" className="hover:text-primary transition-colors">Characters</Link></li>
            <li><Link href="/story" className="hover:text-primary transition-colors">Story</Link></li>
          </ul>
        </div>

        {/* Column 3: Resources Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground font-headline">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Docs</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
          </ul>
        </div>

        {/* Column 4: Stay in the loop */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground font-headline">Stay in the loop</h3>
          <p className="text-sm">
            Join our mailing list to stay in the loop with our newest feature
            releases and platform updates.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="#" aria-label="Twitter"><Twitter className="h-5 w-5 hover:text-primary transition-colors" /></Link>
            <Link href="#" aria-label="Instagram"><Instagram className="h-5 w-5 hover:text-primary transition-colors" /></Link>
            <Link href="#" aria-label="LinkedIn"><Linkedin className="h-5 w-5 hover:text-primary transition-colors" /></Link>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} EchoForge. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
