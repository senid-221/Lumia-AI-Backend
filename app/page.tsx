import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <nav className="landing-nav container">
        <Link href="/" className="logo"><span className="logo-mark">L</span><span className="brand">Lumia<span className="gradient-text"> AI</span></span></Link>
        <div className="nav-actions"><Link href="/signin" className="btn btn-ghost">Sign in</Link><Link href="/signup" className="btn btn-primary">Get started</Link></div>
      </nav>
      <section className="hero container">
        <div className="eyebrow"><span className="dot"/> AI for modern business</div>
        <h1>One simple workspace for your <span className="gradient-text">AI employee.</span></h1>
        <p>Lumia helps you talk to customers, manage products and orders, and grow from one clean workspace.</p>
        <div className="hero-actions"><Link href="/signup" className="btn btn-primary">Create workspace</Link><Link href="/signin" className="btn btn-ghost">Sign in</Link></div>
      </section>
      <section className="simple-features container">
        <Feature number="01" title="Customer conversations" text="Handle everyday questions with Lumia AI and keep human support close." />
        <Feature number="02" title="Products & orders" text="Keep your catalog, inventory and orders organized in one place." />
        <Feature number="03" title="Connected channels" text="Bring your business conversations into one simple workspace." />
      </section>
      <footer className="footer"><div className="container">Lumia AI · Simple tools for growing businesses.</div></footer>
    </main>
  );
}
function Feature({number,title,text}:{number:string;title:string;text:string}){return <article className="simple-feature"><span>{number}</span><h3>{title}</h3><p>{text}</p></article>}
