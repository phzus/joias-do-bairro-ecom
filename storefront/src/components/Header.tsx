'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const { totalItems } = useCart();
  const { isAuthenticated, customer } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-14 md:h-16">
        {/* Left: Menu/Search */}
        <div className="flex items-center gap-4 lg:w-1/3">
          <button
            onClick={onMenuToggle}
            className="text-white/70 hover:text-white transition-colors"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            tabIndex={0}
          >
            {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
          <div
            className="hidden lg:flex items-center gap-2 group cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label="Pesquisar"
          >
            <Search size={18} strokeWidth={1.5} className="text-white/50 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
              Pesquisar
            </span>
          </div>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center">
          <Link to="/" className="block transition-transform hover:scale-105" aria-label="Joias do Bairro" tabIndex={0}>
            <Logo />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-5 lg:w-1/3">
          <Link
            to="/conta"
            className="hidden sm:flex items-center gap-2 group"
            aria-label={isAuthenticated ? 'Minha conta' : 'Entrar'}
            tabIndex={0}
          >
            <User size={20} strokeWidth={1.5} className="text-white/50 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/50 group-hover:text-white transition-colors hidden md:block">
              {isAuthenticated ? (customer?.first_name ?? 'Minha conta') : 'Entrar'}
            </span>
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center group"
            aria-label={`Sacola com ${totalItems} itens`}
            tabIndex={0}
          >
            <ShoppingBag size={20} strokeWidth={1.5} className="text-white/50 group-hover:text-white transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#c8102e] text-white text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
