'use client';

import React from 'react';
import { Mail, Phone, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 py-4 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-black text-brand-dark tracking-tight">
            GoOut<span className="text-brand-orange">Js</span>
          </h3>
          <div className="h-4 w-[1px] bg-slate-300 hidden md:block" />
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hidden md:block">
            Premium Events
          </p>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="mailto:gooutjs@wideservices.com"
            className="flex items-center gap-2 text-slate-600 hover:text-brand-orange transition-colors group"
          >
            <Mail size={12} className="text-slate-400 group-hover:text-brand-orange" />
            <span className="font-bold text-[10px] uppercase tracking-wider">gooutjs@wideservices.com</span>
          </a>
          <a
            href="tel:+302101234567"
            className="flex items-center gap-2 text-slate-600 hover:text-brand-orange transition-colors group"
          >
            <Phone size={12} className="text-slate-400 group-hover:text-brand-orange" />
            <span className="font-bold text-[10px] uppercase tracking-wider">+30 210 123 4567</span>
          </a>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
          <p>© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
};
