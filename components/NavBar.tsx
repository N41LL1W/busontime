"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, MessageSquarePlus } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Horários', icon: Home },
  { href: '/suggest', label: 'Sugerir', icon: MessageSquarePlus },
  { href: '/about', label: 'Sobre', icon: Info },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t z-20">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group inline-flex flex-col items-center justify-center hover:bg-muted/40 transition-colors"
            >
              <item.icon
                className={`w-6 h-6 mb-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}