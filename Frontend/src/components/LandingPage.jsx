import React from "react";
import { ArrowRight, Scissors, ShoppingCart, Users, TrendingUp, ShieldCheck, Zap, CheckCircle, Store, CreditCard, LayoutDashboard, Lock, Server, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function LandingPage() {
  const navigateToLogin = () => {
    // Actually navigate and force reload/render of the new route
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-x-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 py-3 md:px-8 md:py-4 border-b border-white/10 backdrop-blur-xl bg-slate-900/90 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-lg shadow-indigo-500/20">
            VE
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-white text-lg tracking-wide uppercase leading-tight">
              Vastra ERP
            </h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">
              Threadflow Architecture
            </span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-400 tracking-wide uppercase">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>

        <button 
          onClick={navigateToLogin}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2 uppercase tracking-wider"
        >
          Business Login <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 pb-12 md:pt-36 md:pb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md mb-6 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v1.2 SaaS PRO is now live</span>
        </div>
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-4 max-w-5xl leading-[1.1]">
          The Ultimate OS for <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
            Garment Boutiques
          </span>
        </h2>
        
        <p className="text-base md:text-lg text-slate-400 max-w-2xl font-medium mb-8 leading-relaxed px-4">
          From advanced POS billing and bespoke tailoring articulation to multi-tenant CRM and intelligent inventory tracking. Threadflow handles it all in one highly secure ecosystem.
        </p>

        <button 
          onClick={navigateToLogin}
          className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 text-sm font-black rounded-2xl transition-all shadow-xl shadow-white/10 active:scale-95 uppercase tracking-wide flex items-center gap-2"
        >
          Access Your Portal <ArrowRight className="w-5 h-5" />
        </button>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 md:py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">How Threadflow Works</h3>
            <p className="text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">A seamless operational flow from the moment a customer walks into your boutique to the final garment delivery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            
            {[
              { icon: Store, step: "01", title: "Intake & Articulation", desc: "Customer walks in. You record measurements, fabric choices, and design blueprints in the Articulation Window." },
              { icon: LayoutDashboard, step: "02", title: "Production Tracking", desc: "Tailors receive digital job cards. Inventory stock (fabric, buttons) is automatically deducted in real-time." },
              { icon: CreditCard, step: "03", title: "POS & Delivery", desc: "Job completes. One-click POS billing generates the final invoice, awards loyalty points, and updates ledgers." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-[10px] font-black text-indigo-500 mb-1 tracking-widest uppercase">Step {item.step}</span>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 md:py-16 px-6 relative z-10 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">Core Features</h3>
            <p className="text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">Engineered specifically for the garment industry's unique workflows.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShoppingCart, title: "POS Billing", desc: "Lightning fast checkout, thermal receipt generation, and real-time inventory deductions.", color: "text-indigo-400", bg: "bg-indigo-500/10" },
              { icon: Scissors, title: "Tailoring Articulation", desc: "Parametric measurement tracking, bespoke blueprints, and direct-to-tailor workflows.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Users, title: "CRM & Loyalty", desc: "Multi-tiered loyalty programs, outstanding balance ledgers, and customer analytics.", color: "text-amber-400", bg: "bg-amber-500/10" },
              { icon: TrendingUp, title: "Advanced Reports", desc: "Profit & loss telemetry, multi-dimensional sales tracking, and tax-ready exports.", color: "text-rose-400", bg: "bg-rose-500/10" },
              { icon: ShieldCheck, title: "Role-Based Access", desc: "Strictly govern who sees what. Managers, tailors, and admins have custom Dashboards.", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Zap, title: "Multi-Tenant SaaS", desc: "Manage multiple retail chains from a single centralized super-admin portal seamlessly.", color: "text-purple-400", bg: "bg-purple-500/10" }
            ].map((feat, i) => (
              <div key={i} className="p-6 md:p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/80 transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{feat.title}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">SaaS Subscription Plans</h3>
            <p className="text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">Transparent pricing designed to scale with your boutique.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { name: "Starter", price: "₹2,499", cycle: "/month", desc: "Perfect for single-store tailoring boutiques.", features: ["POS Billing", "Custom Articulations", "CRM Loyalty Ledgers", "5 User Seats", "2 GB Cloud Storage"] },
              { name: "Professional", price: "₹5,999", cycle: "/month", desc: "For growing garment retail chains.", popular: true, features: ["Everything in Starter", "Bulk Markdown Engines", "Corporate Cashbooks", "25 User Seats", "10 GB Cloud Storage"] },
              { name: "Enterprise", price: "₹14,999", cycle: "/month", desc: "Full-scale ERP for major fashion houses.", features: ["Everything in Professional", "Multi-Warehouse Transfers", "Biometric HR Clock IN", "Unlimited User Seats", "Unlimited Storage"] }
            ].map((plan, i) => (
              <div key={i} className={`p-6 md:p-8 rounded-3xl border flex flex-col relative ${plan.popular ? 'bg-indigo-950/50 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                
                <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                <p className="text-xs text-slate-400 font-medium mb-4 h-8">{plan.desc}</p>
                
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-500 font-bold">{plan.cycle}</span>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300 font-medium leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={navigateToLogin}
                  className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-12 md:py-16 px-6 relative z-10 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-4">Military-Grade Security</h3>
          <p className="text-slate-400 font-medium text-sm md:text-base mb-10 leading-relaxed">
            Your boutique's ledger data, employee records, and customer PII are strictly protected. We deploy zero-trust architectures and encryption across all active vaults.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex gap-4">
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-1">AES-256 Encryption</h4>
                <p className="text-slate-400 text-sm">All database transactions and backups are encrypted at rest and in transit.</p>
              </div>
            </div>
            <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex gap-4">
              <Server className="w-7 h-7 text-indigo-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-1">Isolated Cloud Vaults</h4>
                <p className="text-slate-400 text-sm">True multi-tenancy ensures your business data is absolutely sealed off from others.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-8 px-6 md:px-12 relative z-10 bg-slate-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand & About */}
          <div className="md:col-span-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg font-sans tracking-tight">
                VE
              </div>
              <div className="text-left">
                <p className="font-extrabold text-white text-lg tracking-wider uppercase">Vastra ERP</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Threadflow SaaS</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering garment boutiques globally with next-generation ERP tools. Built with absolute precision for tailoring, POS billing, and real-time inventory management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li><a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Core Features</a></li>
              <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing Plans</a></li>
              <li><a href="#security" className="hover:text-indigo-400 transition-colors">Security Details</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-5">Contact Us</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-indigo-400" /> +91 (800) 123-4567</li>
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-indigo-400" /> support@requinsolutions.com</li>
              <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> 123 Tech Boulevard, Phase 2, Silicon Valley, CA 94025</li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-5">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all text-slate-400 hover:text-white">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all text-slate-400 hover:text-white">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all text-slate-400 hover:text-white">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all text-slate-400 hover:text-white">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <p>© 2026 Requin Solutions. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
