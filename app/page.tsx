import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <nav className="landing-nav container">
        <Link href="/" className="logo"><span className="logo-mark">L</span><span className="brand">Lumia<span className="gradient-text"> AI</span></span></Link>
        <div className="nav-actions"><Link href="/signin" className="btn btn-ghost">Sign in</Link><Link href="/signup" className="btn btn-primary">Get started</Link></div>
      </nav>
      <section className="hero container">
        <div className="eyebrow"><span className="dot"/> AI employee for modern business</div>
        <h1>Turn every conversation into <span className="gradient-text">growth.</span></h1>
        <p>Lumia AI helps businesses sell, support customers and automate everyday work across WhatsApp, social channels and your storefront.</p>
        <div className="hero-actions"><Link href="/signup" className="btn btn-primary">Start free <span>→</span></Link><Link href="/signin" className="btn btn-ghost">Open dashboard</Link></div>
        <div className="hero-card"><div className="mock-window"><div className="mock-top"><i className="mock-dot"/><i className="mock-dot"/><i className="mock-dot"/></div><div className="mock-body"><aside className="mock-side"><div/><div/><div/><div/><div/><div/></aside><div className="mock-main"><div className="mock-stat-row"><div className="mock-stat"><small>AI conversations</small><b>1,284</b></div><div className="mock-stat"><small>Orders</small><b>186</b></div><div className="mock-stat"><small>Revenue</small><b>4.8M</b></div></div><div style={{marginTop:14,height:130,borderRadius:12,background:'linear-gradient(180deg,#f8f7ff,#fff)',border:'1px solid #e5e9f0'}}/></div></div></div></div>
      </section>
      <section className="section container"><h2 className="section-title">One workspace. <span className="gradient-text">Every customer.</span></h2><p className="section-sub">A clean command center for conversations, products, orders, knowledge and marketplace growth.</p><div className="feature-grid"><Feature icon="✦" title="AI conversations" text="Let Lumia answer questions using your business knowledge and customer context."/><Feature icon="▦" title="Commerce built in" text="Manage products, inventory and orders without leaving your workspace."/><Feature icon="◎" title="Social channels" text="Bring WhatsApp, Instagram and Facebook leads into one organized inbox."/></div></section>
      <footer className="footer"><div className="container">© 2026 Lumia AI. Built for ambitious businesses.</div></footer>
    </main>
  );
}
function Feature({icon,title,text}:{icon:string;title:string;text:string}){return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>}
