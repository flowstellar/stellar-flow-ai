import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Bot, Globe, CreditCard, BarChart3, Send, Wallet, Clock, Star, ChevronRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const Landing = () => {
  const navigate = useNavigate();

  const goApp = () => navigate('/app');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 w-full z-50 glass-card border-b border-border/30 rounded-none backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#card" className="hover:text-foreground transition-colors">Card</a>
            <a href="#ai" className="hover:text-foreground transition-colors">AI Agent</a>
            <a href="#stellar" className="hover:text-foreground transition-colors">Stellar</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goApp} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </button>
            <button onClick={goApp}
              className="neon-gradient text-primary-foreground text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 glass-card px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs text-muted-foreground">Live on Stellar Testnet</span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              AI-Powered Banking<br />on <span className="neon-gradient-text">Stellar</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Send, receive, and manage money globally with near-zero fees using Stellar + AI.
              No hidden charges. Instant cross-border payments.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="flex flex-wrap gap-3 mt-8">
              <button onClick={goApp}
                className="neon-gradient text-primary-foreground font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={goApp}
                className="glass-card px-8 py-3.5 rounded-2xl text-base font-semibold text-foreground hover:bg-secondary/50 transition-colors">
                Try Demo
              </button>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Secure</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> 2-5 sec</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> Global</span>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            className="relative hidden lg:block">
            <div className="glass-card p-6 rounded-3xl glow-green space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Balance</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              </div>
              <p className="text-3xl font-bold glow-text-green">2,847.53 <span className="text-lg text-muted-foreground">XLM</span></p>
              <p className="text-sm text-muted-foreground">≈ $1,423.76</p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['Send', 'Receive', 'Convert'].map(a => (
                  <div key={a} className="bg-secondary/50 rounded-xl py-2 text-center text-xs font-medium text-foreground">{a}</div>
                ))}
              </div>
              <div className="space-y-2 pt-2">
                {[{ l: 'Sent to Alice', a: '-50 XLM', c: 'text-destructive' }, { l: 'Received from Bob', a: '+120 USDC', c: 'text-primary' }].map(t => (
                  <div key={t.l} className="bg-secondary/30 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.l}</span>
                    <span className={`text-xs font-semibold ${t.c}`}>{t.a}</span>
                  </div>
                ))}
              </div>
              {/* AI preview bubble */}
              <div className="bg-secondary/30 rounded-xl p-3 flex items-start gap-2">
                <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">AI Insight</p>
                  <p className="text-[11px] text-foreground">You saved 30% in fees this week 🎉</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-40 h-40 rounded-full bg-accent/10 blur-[80px]" />
          </motion.div>
        </div>
      </section>

      {/* Virtual Card Section */}
      <section id="card" className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="w-80 h-48 rounded-3xl relative overflow-hidden mx-auto lg:mx-0"
              style={{ background: 'linear-gradient(135deg, hsl(270 80% 30%), hsl(210 100% 40%), hsl(155 100% 30%))' }}>
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-white/80 text-sm font-medium">StellarFlow</span>
                  <CreditCard className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Card Number</p>
                  <p className="text-white text-lg font-mono tracking-wider">•••• •••• •••• 4829</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/60 text-[10px]">Card Holder</p>
                    <p className="text-white text-sm font-medium">STELLAR USER</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px]">Valid Thru</p>
                    <p className="text-white text-sm font-medium">12/28</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <h2 className="text-3xl font-bold">Your <span className="neon-gradient-text">Virtual Card</span></h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Spend XLM and USDC anywhere. Instant conversion at the point of sale with zero hidden fees.</p>
            <div className="mt-6 space-y-3">
              {['Global payments in 150+ countries', 'Spend XLM or USDC seamlessly', 'Real-time conversion at best rates', 'Freeze & unfreeze instantly'].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Assistant Preview */}
      <section id="ai" className="py-20 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-purple/5 blur-[150px]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold">AI-Powered <span className="neon-gradient-text">Payment Agent</span></h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Just tell the AI what you need. It builds, signs, and submits real Stellar transactions for you.</p>
            <div className="mt-6 space-y-2">
              {['"Send $50 to John"', '"How much did I spend this week?"', '"Convert 100 XLM to USDC"'].map(cmd => (
                <div key={cmd} className="glass-card px-4 py-2.5 rounded-xl text-sm text-muted-foreground italic">{cmd}</div>
              ))}
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="glass-card rounded-3xl p-5 space-y-3 max-w-sm mx-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <div className="w-7 h-7 rounded-lg neon-gradient flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold">AI Agent</span>
                <span className="text-[10px] text-primary ml-auto">Online</span>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[80%]">
                  How can I help you today?
                </div>
                <div className="flex justify-end">
                  <div className="neon-gradient rounded-2xl rounded-br-md px-3 py-2 text-xs text-primary-foreground max-w-[80%]">
                    Send 50 XLM to Alice
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[85%] space-y-2">
                  <p>I'll send <strong>50 XLM</strong> to Alice.</p>
                  <div className="bg-primary/10 rounded-lg p-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Amount</span>
                      <span>50 XLM</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="text-primary">~0.00001 XLM</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 neon-gradient text-primary-foreground text-[10px] font-semibold py-1.5 rounded-lg text-center">Approve</div>
                    <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-[10px] rounded-lg">Cancel</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl font-bold">Everything You <span className="neon-gradient-text">Need</span></motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground mt-3">A complete financial ecosystem powered by Stellar</motion.p>
        </div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Wallet, title: 'Multi-Asset Wallet', desc: 'Hold XLM, USDC, and custom tokens securely' },
            { icon: Send, title: 'Cross-Border Transfers', desc: 'Send money globally in 2-5 seconds' },
            { icon: BarChart3, title: 'AI Insights', desc: 'Smart analytics on your spending habits' },
            { icon: CreditCard, title: 'Virtual Card', desc: 'Spend crypto anywhere with instant conversion' },
            { icon: Bot, title: 'AI Agent', desc: 'Execute transactions with natural language' },
            { icon: Shield, title: 'Bank-Grade Security', desc: 'PIN lock, encrypted keys, secure storage' },
            { icon: Clock, title: 'Scheduled Payments', desc: 'Automate recurring transfers easily' },
            { icon: Globe, title: 'Global Network', desc: '150+ countries supported on Stellar' },
          ].map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
              className="glass-card p-5 rounded-2xl hover:bg-secondary/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stellar Blockchain */}
      <section id="stellar" className="py-20 px-6 relative">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl font-bold">Built on <span className="neon-gradient-text">Stellar</span></motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground mt-3 max-w-lg mx-auto">The fastest, cheapest, and most reliable blockchain for payments</motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[
              { value: '2-5s', label: 'Transaction Speed' },
              { value: '$0.00001', label: 'Average Fee' },
              { value: '150+', label: 'Countries Supported' },
              { value: 'USDC', label: 'Stablecoin Support' },
            ].map((s, i) => (
              <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
                className="glass-card p-6 rounded-2xl text-center">
                <p className="text-2xl font-bold neon-gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl font-bold">What Users <span className="neon-gradient-text">Say</span></motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            { name: 'Alex M.', role: 'Freelancer', text: 'StellarFlow changed how I receive international payments. Near-zero fees and instant settlements.' },
            { name: 'Sarah K.', role: 'Startup Founder', text: 'The AI assistant is incredible. I just type "send 100 XLM to my designer" and it handles everything.' },
            { name: 'David L.', role: 'Investor', text: 'Clean UI, real blockchain integration, and smart insights. This is the future of fintech.' },
          ].map((t, i) => (
            <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
              className="glass-card p-6 rounded-2xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 text-primary fill-primary" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[160px]" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-bold">Ready to Join the<br /><span className="neon-gradient-text">Future of Finance?</span></motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground mt-4">No hidden fees. Financial freedom, simplified.</motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="flex flex-wrap justify-center gap-3 mt-8">
            <button onClick={goApp}
              className="neon-gradient text-primary-foreground font-bold px-10 py-4 rounded-2xl flex items-center gap-2 text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Create Account <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={goApp}
              className="glass-card px-10 py-4 rounded-2xl text-base font-semibold text-foreground hover:bg-secondary/50 transition-colors">
              Launch App
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg neon-gradient flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by <span className="neon-gradient-text font-semibold">Stellar</span> ⚡ © 2026 StellarFlow</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
