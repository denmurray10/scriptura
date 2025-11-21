
import { cn } from "@/lib/utils";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
      <svg 
        width="36" 
        height="36" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        <path d="M5.50244 6.55624C5.50244 6.55624 8.58359 8.24353 12.0024 4.55624C15.4213 8.24353 18.5024 6.55624 18.5024 6.55624C18.5024 6.55624 16.1432 10.5186 21.0024 13.5562C16.1432 10.5186 15.4213 19.5562 12.0024 19.5562C8.58359 19.5562 7.86156 10.5186 3.00244 13.5562C7.86156 10.5186 5.50244 6.55624 5.50244 6.55624Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
};

export default Logo;
