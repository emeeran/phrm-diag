import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LegalLayout({ children }) {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  );
}
