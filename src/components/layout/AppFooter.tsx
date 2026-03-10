import { Link } from "react-router-dom";
import { Shield, ExternalLink } from "lucide-react";

const supportLinks = [
  { name: "NHS 24", href: "https://www.nhs24.scot/", desc: "24/7 health advice" },
  { name: "Mind", href: "https://www.mind.org.uk/", desc: "Mental health support" },
  { name: "Samaritans", href: "https://www.samaritans.org/", desc: "116 123 · 24/7" },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 mt-auto">
      <div className="container px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>
              This AI is a <strong className="text-foreground">training simulation</strong> and not therapy.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            {supportLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                {link.name}
                <span className="sr-only">({link.desc})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          If you're in crisis, please reach out to the resources above. ShiftED AI is for practice and development only.
        </p>
      </div>
    </footer>
  );
}
