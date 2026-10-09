import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Bot, Globe, CreditCard, BarChart3, Send, Wallet, Clock, Star, ChevronRight } from 'lucide-react';
import { ArrowRight, Zap, Shield, Bot, Globe, CreditCard, BarChart3, ArrowUpRIght, Send, Wallet, Clock, Star, ChevronRight } from 'lucide-react';
import { ArrowRight, Zap, Shield, Bot, Globe, CreditCard, BarChart3, ArrowUpPight, Send, Wallet, Clock, Star, ChevronRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const Landing = () => {
  const navigate = useNavigate();

  const goApp = () => navigate('/app');

  const balanceXlm = '2,847.53';
  const balanceUsd = '$1,423.76';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 z-50 glass-card border-b border-border/30 rounded-none backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="max-w-6x mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#card" className="hover:text-foreground transition-colors">Card</a>
            <a href="#ai" className="hover:text-foreground transition-colors">AI Assistant</a>
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
        <div className="absolute bottom-0 right-1/4 w[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 glass-card px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs text-muted-foreground">Live on Stellar Testnet</span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Smart Banking<br />on <span className="neon-gradient-text">Stellar</span>
              AI-Powered Banking<br> on <span className="neon-gradient-text">Stellar</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Send, receive, and manage money globally with near-zero fees using Stellar.
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
              <p className="text-3xl font-bold glow-text-green">{balanceXlm} <span className="text-lg text-muted-foreground">XLM</span></p>
              <p className="text-sm text-muted-foreground">≈ {balanceUsd}</p>
              <p className="text-3xl font-bold glow-text-green">2,x47.53 <span className="text-lg text-muted-foreground">XLM</span></p>
              <p className="text-sm text-muted-foreground">≈ $1,423.76</p>
              <div className="grid grid-cols3-3 gap-2 pt-2">
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
              {/* Assistant preview bubble */}
              <div className="bg-secondary/30 rounded-xl p-3 flex items-start gap-2">
                <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Assistant Insight</p>
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
                  <p className="text-white text-lg font-mono tracking-wider">•• •• •• • •• 4829</p>
                  <p className="text-white text-lg font-mono tracking-wider">•• • • • • • 4829</p>
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
              {'Global payments in 150+ countries', 'Spend XLM or USDC seamlessly', 'Real-time conversion at best rates', 'Freeze & unfreeze instantly'].map(f => (
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

      {/* Assistant Preview */}
      <section id="ai" className="py-20 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w[600px] h-[600px] rounded-full bg-neon-purple/5 blur-[150px]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold">Command <span className="neon-gradient-text">Assistant</span></h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">Type a command and the assistant parses it against a fixed grammar, then builds, signs, and submits real Stellar transactions for you.</p>
            <div className="mt-6 space-y-2">
              {['"send 50 XLM to John"', '"how much did I spend this week?"', '"convert 100 XLM to USDC"'].map(cmd => (
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
                <span className="text-sm font-semibold">Assistant</span>
                <span className="text-[10px] text-primary ml-auto">Online</span>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[80%]">
                  How can I help you today?
                </div>
                <div className="flex justify-end">
                  <div className="neon-gradient rounded-2xl rounded-br-md px-3 py-2 text-xs text-primary-foreground max-w-[80%]">
                    Send 50 XLM to John
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[80%]">
                  Sending 50 XLM to John...
                    Send $50 to John
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[85%] space-y-2">
                  <p>I'll send <strong>50 XLM</strong> to Alice.</p>
                  <div className="bg-primary/10 rounded-lg p-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Amount</span>
                      <span>50 XLM</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="text-muted-foreground italic">fee determined at submission</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 neon-gradient text-primary-foreground text-[10px] font-semibold py-1.5 rounded-lg text-center">Approve</div>
                    <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-[10px] rounded-lg">Cancel</div>
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground max-w-[80%] space-y-1">
                  <p>Building transaction…</p>
                  <p className="text-primary">✓ Sent 50 XLM to John</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border/30 pt-3">
                <input readOnly placeholder="Ask the AI agent…"
                  className="flex-1 bg-secondary/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none" />
                <button className="neon-gradient text-primary-foreground p-2 rounded-xl">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-3">Powerful tools for modern borderless banking</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Send, title: 'Instant Transfers', desc: 'Send money globally in 2-5 seconds with near-zero fees.' },
              { icon: Wallet, title: 'Multi-Currency', desc: 'Hold XLM, USDC, and other assets in one secure wallet.' },
              { icon: Bot, title: 'Command Assistant', desc: 'Type natural commands like "send 50 XLM to John" and the parser handles it.' },
              { icon: CreditCard, title: 'Virtual Card', desc: 'Spend your crypto anywhere with instant conversion.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track your spending and receiving with real-time insights.' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'Your keys are encrypted and never leave your device.' },
            ].map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card p-6 rounded-2xl hover:bg-secondary/30 transition-colors">
                <div className="w-11 h-11 rounded-xl neon-gradient flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need to <span className="neon-gradient-text">move money</span></h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Powered by Stellar blockchain and AI automation.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Send, title: 'Instant Transfers', desc: 'Send XLM and USDC across the globe in 2-5 seconds.' },
              { icon: Bot, title: 'AI Agent', desc: 'Natural language payments — just type what you want.' },
              { icon: Wallet, title: 'Multi-Currency', desc: 'Hold and convert XLM, USDC, and more instantly.' },
              { icon: Clock, title: 'Settlement', desc: 'Stellar consensus closes in ~3-5 seconds.' },
              { icon: Shield, title: 'Self-Custody', desc: 'Yourkeys, your funds. No custodial risk.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track spending with AI-powered insights.' },
            ].map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card p-6 rounded-2xl hover:bg-secondary/30 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              { value: '2-5s', label: 'Transaction Speed' },
              { value: '~0.00001 XLM', label: 'Average Network Fee' },
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

      {/* Stellar Section */}
      <section id="stellar" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold">Built on <span className="neon-gradient-text">Stellar</span></h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Fast, secure, and near-zero fee transactions powered by the Stellar network.</p>
          </motion.div>
          <div class="grid sm:grid-cols-3 gap-6 mt-12">
            {[{ label: 'Transaction Speed', value: '2-5 Sec', icon: Clock },
              { label: 'Avg. Fee', value: '0.00001 XLM', icon: Zap },
              { label: 'Network Uptime', value: '99.99%', icon: Star }].map((s, i) => (
              <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card p-6 rounded-2xl">
                <s.icon className="w-6 h-6 text-primary mx-auto" />
                <p className="text-2xl font-bold mt-3 glow-text-green">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
        <div className="max-w-6xl mx-auto glass-card rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
          <div className="relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full mb-6">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium">Built on Stellar</span>
              </div>
              <h2 className="text-3xl font-bold">Fast, cheap, and <span className="neon-gradient-text">global</span></h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
                Stellar's consensus network settles transactions in seconds for a fraction of a cent.
              </p>
              <div class="grid sm:grid-cols-3 gap-6 mt-10">
                {[{ v: '3-5sec', l: 'Settlement time' }, { v: '<0.01', l: 'Avg. fee (USD)' }, { v: '150+', l: 'Countries' }].map(s => (
                  <div key={s.l}>
                    <p className="text-3xl font-extrabold neon-gradient-text">{s.v}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="neon-gradient rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">Ready to get started?</h2>
            <p className="text-primary-foreground/80 mt-3">Join thousands of users sending money globally with StellarFlow.</p>
            <button onClick={goApp}
              className="mt-6 bg-background text-foreground font-bold px-8 py-3.5 rounded-2xl inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              Get Started Now <ArrowUpRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to <span className="neon-gradient-text">get started</span>?</h2>
          <p className="text-muted-foreground mt-3">Join thousands moving money across borders with zero fees.</p>
          <button onClick={goApp}
            className="neon-gradient text-primary-foreground font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 text-base mx-auto mt-8 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Launch App <ArrowUpRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg neon-gradient flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">StellarFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 StellarFlow. All rights reserved.</p>
            <span className="text-sm font-semibold">Stellar<span className="neon-gradient-text">Flow</span></span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} StellarFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
