import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="bg-green-800 text-white py-4 fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="container flex items-center ml-10 my-0">
        <img
          src="/images/logoBusontime-rbg.png"
          alt="Logo BUSONTIME"
          className="w-12"
        />
        <h1 className="text-xl font-bold px-4">BUSONTIME</h1>
        <p className="text-sm">Sistema de Horários de Transporte</p>

        {/* Menu de Navegação */}
        <nav className="ml-8 flex space-x-6">
          <Link href="/">
            <span
              className={`px-4 py-2 rounded-md transition-all ${
                router.pathname === "/"
                  ? "bg-white bg-opacity-20"
                  : "hover:bg-white hover:bg-opacity-10"
              }`}
            >
              HOME
            </span>
          </Link>
          <Link href="/page">
            <span
              className={`px-4 py-2 rounded-md transition-all ${
                router.pathname === "/page"
                  ? "bg-white bg-opacity-20"
                  : "hover:bg-white hover:bg-opacity-10"
              }`}
            >
              CONFIG
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
