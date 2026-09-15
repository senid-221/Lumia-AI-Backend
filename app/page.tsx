import Link from 'next/link';

const features = [
  { number: '01', title: 'Customer conversations', text: 'Answer everyday questions with Lumia AI and keep human support close.' },
  { number: '02', title: 'Products & orders', text: 'Manage products, stock and orders from one simple workspace.' },
  { number: '03', title: 'Grow your business', text: 'Save time, understand your business and serve customers better with AI.' },
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav container">
        <Link href="/" className="logo" aria-label="Lumia AI home">
          <span className="logo-mark">L</span>
          <span className="brand">Lumia<span className="gradient-text"> AI</span></span>
        </Link>
        <div className="nav-actions">
          <Link href="/signin" className="btn btn-ghost">Sign in</Link>
        </div>
      </nav>

      <section className="hero container">
        <span className="eyebrow"><span className="dot" /> AI for modern business</span>
        <h1>USE AI IN<br /><span className="gradient-text">YOU BUSINESS</span></h1>
        <p>Lumia helps you talk to customers, manage products and orders, and grow from one simple workspace.</p>
        <div className="hero-actions">
          <Link href="/signup" className="btn btn-primary hero-cta">Get started <span aria-hidden="true">→</span></Link>
        </div>
        <span className="hero-note">Simple. Powerful. Built for Rwanda.</span>
      </section>

      <section className="features container" aria-label="Lumia AI features">
        {features.map((feature) => (
          <article className="simple-feature" key={feature.number}>
            <span className="feature-number">{feature.number}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2026 Lumia AI</span>
          <span>Built for modern businesses.</span>
        </div>
      </footer>
    </main>
  );
}
