'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type View = 'Overview' | 'Conversations' | 'Customers' | 'Products' | 'Orders' | 'Knowledge' | 'Marketplace' | 'Channels' | 'Settings';

const nav: { name: View; icon: string; group: string }[] = [
  { name: 'Overview', icon: '⌂', group: 'Workspace' },
  { name: 'Conversations', icon: '○', group: 'Workspace' },
  { name: 'Customers', icon: '◌', group: 'Workspace' },
  { name: 'Products', icon: '□', group: 'Workspace' },
  { name: 'Orders', icon: '◇', group: 'Workspace' },
  { name: 'Knowledge', icon: '✦', group: 'Workspace' },
  { name: 'Marketplace', icon: '◈', group: 'Growth' },
  { name: 'Channels', icon: '◎', group: 'Growth' },
  { name: 'Settings', icon: '⚙', group: 'Growth' },
];

const orders = [
  ['#1048', 'Jean Claude', 'RWF 86,000', 'Delivered', 'green'],
  ['#1047', 'Aline M.', 'RWF 52,000', 'Processing', 'blue'],
  ['#1046', 'Eric N.', 'RWF 38,000', 'Pending', 'amber'],
  ['#1045', 'Divine K.', 'RWF 91,000', 'Delivered', 'green'],
];

const products = [
  ['Classic Sneakers', 'RWF 38,000', '120 in stock', 'SN'],
  ['Everyday Backpack', 'RWF 29,500', '48 in stock', 'BP'],
  ['Minimal Watch', 'RWF 52,000', '26 in stock', 'MW'],
  ['Lumia Hoodie', 'RWF 45,000', '74 in stock', 'LH'],
  ['Travel Bottle', 'RWF 18,500', '91 in stock', 'TB'],
  ['Desk Lamp', 'RWF 24,000', '33 in stock', 'DL'],
];

export default function Dashboard() {
  const [active, setActive] = useState<View>('Overview');
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/business').then((r) => (r.ok ? r.json() : null)),
    ]).then(([u, b]) => {
      setUser(u?.user);
      setBusiness(b?.business);
    });
  }, []);

  const go = (view: View) => {
    setActive(view);
    setOpen(false);
  };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link href="/" className="logo">
            <span className="logo-mark">L</span>
            <span className="brand">Lumia<span className="gradient-text"> AI</span></span>
          </Link>
        </div>

        <div className="workspace">
          <small>WORKSPACE</small>
          <strong>{business?.name || 'My Business'}</strong>
        </div>

        {['Workspace', 'Growth'].map((group) => (
          <div key={group}>
            <div className="nav-section">{group}</div>
            <div className="nav-list">
              {nav.filter((item) => item.group === group).map((item) => (
                <button key={item.name} className={`nav-item ${active === item.name ? 'active' : ''}`} onClick={() => go(item.name)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">{(user?.name || 'LU').slice(0, 2).toUpperCase()}</div>
            <div>
              <b style={{ fontSize: 12 }}>{user?.name || 'Lumia User'}</b>
              <small>{user?.email || 'Signed in'}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="top-actions">
            <button className="icon-btn mobile-menu" onClick={() => setOpen((v) => !v)} aria-label="Open menu">☰</button>
            <span className="top-title">{active}</span>
          </div>
          <div className="top-actions">
            <Link href="/" className="btn btn-soft">Website</Link>
          </div>
        </header>

        <main className="page">
          {active === 'Overview' && <Overview />}
          {active === 'Conversations' && <Conversations />}
          {active === 'Customers' && <Customers />}
          {active === 'Products' && <Products />}
          {active === 'Orders' && <Orders />}
          {active === 'Knowledge' && <Knowledge />}
          {active === 'Marketplace' && <Marketplace />}
          {active === 'Channels' && <Channels />}
          {active === 'Settings' && <Settings name={business?.name || ''} />}
        </main>
      </div>
    </div>
  );
}

function PageHead({ title, text, action }: { title: string; text: string; action?: string }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1><p>{text}</p></div>
      {action && <button className="btn btn-primary">{action}</button>}
    </div>
  );
}

function Overview() {
  return (
    <>
      <PageHead title="Overview" text="A simple view of what is happening in your business." action="+ New conversation" />
      <div className="stat-grid">
        <Stat l="AI conversations" v="1,284" m="+18.4% this month" />
        <Stat l="Customers" v="846" m="+12.7% this month" />
        <Stat l="Orders" v="186" m="+9.3% this month" />
        <Stat l="Revenue" v="RWF 4.82M" m="+21.6% this month" />
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-head"><h3>Revenue</h3><span>Last 7 days</span></div>
          <div className="panel-body"><div className="chart">{[42,58,49,75,62,92,78,96,70,84,66,100].map((h, i) => <div key={i} className="bar" style={{ height: `${h}%` }} />)}</div></div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Recent activity</h3><span>Today</span></div>
          <div className="panel-body"><div className="activity">
            <Activity a="AI" t="24 conversations resolved" s="8 minutes ago" />
            <Activity a="PR" t="New product added" s="31 minutes ago" />
            <Activity a="OR" t="Order #1048 delivered" s="1 hour ago" />
            <Activity a="WA" t="WhatsApp connected" s="2 hours ago" />
          </div></div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-head"><h3>Recent orders</h3><button className="panel-link">View all</button></div>
        <OrderTable />
      </section>
    </>
  );
}

function Conversations() {
  return <><PageHead title="Conversations" text="See customer messages and let Lumia handle the routine work." action="+ New conversation" /><section className="panel"><div className="conversation-list">
    {[
      ['Aline M.', 'Do you still have the black sneakers in size 39?', '2 min', 'AI replied'],
      ['Jean Claude', 'I would like to know where my order is.', '8 min', 'AI replied'],
      ['Divine K.', 'Can someone from the team help me?', '21 min', 'Needs human'],
      ['Eric N.', 'What is the price of the backpack?', '34 min', 'AI replied'],
    ].map((c) => <div className="conversation-row" key={c[0]}><div className="avatar">{c[0].slice(0, 2).toUpperCase()}</div><div className="conversation-copy"><b>{c[0]}</b><span>{c[1]}</span></div><div className="conversation-meta"><small>{c[2]}</small><em>{c[3]}</em></div></div>)}
  </div></section></>;
}

function Customers() {
  return <><PageHead title="Customers" text="Keep customer relationships in one place." action="+ Add customer" /><section className="panel"><div className="panel-head"><h3>Customer list</h3><input className="search" placeholder="Search customers…" /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Channel</th><th>Orders</th><th>Last activity</th></tr></thead><tbody>{[['Aline M.','WhatsApp','12','2 min ago'],['Jean Claude','WhatsApp','8','8 min ago'],['Divine K.','Instagram','5','21 min ago'],['Eric N.','Facebook','3','34 min ago']].map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div></section></>;
}

function Products() {
  return <><PageHead title="Products" text="Manage your catalog and inventory." action="+ Add product" /><div className="cards-grid">{products.map((p) => <article className="product-card" key={p[0]}><div className="product-image">{p[3]}</div><h3>{p[0]}</h3><p>{p[2]}</p><div className="product-price">{p[1]}</div></article>)}</div></>;
}

function Orders() {
  return <><PageHead title="Orders" text="Track every order from first click to delivery." /><section className="panel"><div className="panel-head"><h3>All orders</h3><input className="search" placeholder="Search orders…" /></div><OrderTable full /></section></>;
}

function OrderTable({ full = false }: { full?: boolean }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th>{full && <th>Channel</th>}</tr></thead><tbody>{orders.map((o) => <tr key={o[0]}><td><b>{o[0]}</b></td><td>{o[1]}</td><td>{o[2]}</td><td><span className={`badge badge-${o[4]}`}>{o[3]}</span></td>{full && <td>WhatsApp</td>}</tr>)}</tbody></table></div>;
}

function Knowledge() {
  return <><PageHead title="Knowledge" text="Give Lumia the information it needs to answer customers correctly." action="+ Add knowledge" /><div className="setting-grid"><section className="setting-card"><h3>Business knowledge</h3><div className="knowledge-item"><b>About the business</b><span>Company information and customer-facing details</span></div><div className="knowledge-item"><b>Product information</b><span>Prices, stock, descriptions and policies</span></div><div className="knowledge-item"><b>Delivery policy</b><span>Delivery areas, timing and fees</span></div></section><section className="setting-card"><h3>AI readiness</h3><div className="notice">Add accurate business information so Lumia can give useful answers without guessing.</div><div className="readiness"><strong>Business profile</strong><span>Ready</span></div><div className="readiness"><strong>Product knowledge</strong><span>Ready</span></div><div className="readiness"><strong>Customer context</strong><span>Ready</span></div></section></div></>;
}

function Marketplace() {
  return <><PageHead title="Marketplace" text="Discover products from participating sellers and manage your marketplace activity." action="Add store" /><div className="stat-grid"><Stat l="Active sellers" v="24" m="Connected" /><Stat l="Marketplace products" v="1,842" m="Live" /><Stat l="Orders" v="96" m="This month" /><Stat l="Commission" v="RWF 820K" m="This month" /></div><section className="panel table-panel"><div className="panel-head"><h3>Marketplace activity</h3><span>Latest</span></div><div className="empty"><strong>Marketplace is ready</strong><span>Connect sellers and product sources to start publishing products.</span></div></section></>;
}

function Channels() {
  return <><PageHead title="Channels" text="Connect the places where customers talk to your business." /><div className="setting-grid"><section className="setting-card"><h3>Channels</h3><Channel i="W" n="WhatsApp" s="Connected" /><Channel i="f" n="Facebook" s="Ready to connect" /><Channel i="◎" n="Instagram" s="Ready to connect" /><Channel i="T" n="TikTok" s="Coming soon" /></section><section className="setting-card"><h3>AI response policy</h3><div className="notice">Lumia uses your business knowledge and customer context to make responses more relevant.</div><div className="field"><label>Default tone</label><select><option>Helpful & professional</option><option>Friendly & concise</option><option>Sales focused</option></select></div><div className="field"><label>Human handoff</label><select><option>When customer requests a human</option><option>After 3 failed answers</option></select></div></section></div></>;
}

function Settings({ name }: { name: string }) {
  return <><PageHead title="Settings" text="Control your workspace and business profile." action="Save changes" /><div className="setting-grid"><section className="setting-card"><h3>Business profile</h3><div className="field"><label>Business name</label><input defaultValue={name} placeholder="My Business" /></div><div className="field"><label>Phone</label><input placeholder="+250 7xx xxx xxx" /></div><div className="field"><label>Address</label><input placeholder="Kigali, Rwanda" /></div></section><section className="setting-card"><h3>Workspace</h3><div className="notice">Connect channels and add knowledge to improve Lumia AI responses.</div><div className="field"><label>Timezone</label><select defaultValue="Africa/Kigali"><option>Africa/Kigali</option><option>Africa/Nairobi</option><option>UTC</option></select></div><div className="field"><label>Business description</label><textarea rows={5} placeholder="Tell Lumia about your business…" /></div></section></div></>;
}

function Stat({ l, v, m }: { l: string; v: string; m: string }) { return <div className="stat-card"><div className="stat-label">{l}</div><div className="stat-value">{v}</div><div className="stat-meta">{m}</div></div>; }
function Activity({ a, t, s }: { a: string; t: string; s: string }) { return <div className="activity-row"><div className="activity-icon">{a}</div><div><b>{t}</b><span>{s}</span></div></div>; }
function Channel({ i, n, s }: { i: string; n: string; s: string }) { return <div className="channel-card"><div className="channel-left"><div className="channel-icon">{i}</div><div><strong>{n}</strong><small>{s}</small></div></div><span className="toggle">{s === 'Connected' ? 'ACTIVE' : s === 'Coming soon' ? 'SOON' : 'CONNECT'}</span></div>; }
