// components/NavBar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, MessageSquarePlus } from 'lucide-react'; // Importa o novo ícone

const navItems = [
  { href: '/', label: 'Horários', icon: Home },
  { href: '/suggest', label: 'Sugerir', icon: MessageSquarePlus }, // NOVO ITEM
  { href: '/about', label: 'Sobre', icon: Info },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t shadow-t-lg z-20">
      {/* ATENÇÃO: Mudado para grid-cols-3 para acomodar o novo item */}
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium"> 
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted group transition-colors duration-200">
              <item.icon className={`w-6 h-6 mb-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'} group-hover:text-foreground`} />
              <span className={`text-sm transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'} group-hover:text-foreground`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}