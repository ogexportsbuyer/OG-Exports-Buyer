import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Globe2,
  Grid2X2,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import './_group.css';

const palette = {
  background: '#F8F7F3',
  foreground: '#283833',
  card: '#FDFDFB',
  teal: '#0A3335',
  tealText: '#F9F8F6',
  secondary: '#EFEDE6',
  muted: '#40534C',
  lightGreen: '#E3EEEC',
  orange: '#B84B0F',
  border: '#DFDDD7',
};

const products = [
  {
    id: 'preview-sesame-seeds',
    name: 'Sesame Seeds',
    category: 'Seeds & Oilseeds',
    origin: 'Pakistan',
    image: 'https://api.ogexports.co/product_images/sesame-seeds-1788251385-0-apy2t5.png',
    price: 'USD 1,680',
    moq: '20 MT',
    featured: true,
  },
  {
    id: 'preview-yellow-maize',
    name: 'Yellow Maize (Corn)',
    category: 'Grains',
    origin: 'Pakistan',
    image: 'https://api.ogexports.co/product_images/yellow-maize-corn-1788251429-0-q5nyov.png',
    price: 'USD 295',
    moq: '27 MT',
    featured: true,
  },
  {
    id: 'preview-basmati-rice',
    name: 'Premium Basmati Rice',
    category: 'Rice',
    origin: 'Pakistan',
    image: 'https://api.ogexports.co/product_images/premium-basmati-rice-1788251454-0-dj9bd7.png',
    price: 'USD 1,360',
    moq: '25 MT',
    featured: true,
  },
];

const categories = ['Seeds & Oilseeds', 'Grains', 'Rice'];
const origins = ['Global', 'Pakistan'];
type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export function Luxury() {
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('Global');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState('For you');
  const [notice, setNotice] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => products.filter((item) => {
    const matchesSearch = `${item.name} ${item.category} ${item.origin}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesOrigin = origin === 'Global' || item.origin === origin;
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesOrigin && matchesCategory;
  }), [search, origin, category]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function browse(label?: string) {
    if (label) setSearch(label);
    setActiveTab('Products');
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showNotice(label ? `Showing catalogue results for “${label}”` : 'Catalogue browsing selected');
  }

  function chooseTab(label: string) {
    setActiveTab(label);
    if (label === 'Categories') document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
    else if (label === 'Messages') setSupportOpen(true);
    else if (label === 'Cart') showNotice('Your sourcing basket is ready for products.');
    else if (label === 'My account') setOrdersOpen(true);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const navItems: { label: string; Icon: IconType }[] = [
    { label: 'Home', Icon: Home },
    { label: 'Categories', Icon: Grid2X2 },
    { label: 'Messages', Icon: MessageCircle },
    { label: 'Cart', Icon: ShoppingBag },
    { label: 'My account', Icon: UserRound },
  ];

  return (
    <main className="luxury-page">
      <style>{`
        .luxury-page, .luxury-page * { box-sizing: border-box; }
        .luxury-page { min-height: 100dvh; background: ${palette.background}; color: ${palette.foreground}; font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif; padding-bottom: 88px; overflow: hidden; }
        .luxury-page button, .luxury-page input { font: inherit; }
        .luxury-page button { color: inherit; }
        .luxury-page .serif { font-family: 'Iowan Old Style', 'Baskerville', 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .luxury-page .hide-scroll::-webkit-scrollbar { display: none; }
        .luxury-page .hide-scroll { scrollbar-width: none; }
        .luxury-page .image-fade { background: linear-gradient(0deg, rgba(10,51,53,.63), transparent 62%); }
        .luxury-page .lift { transition: transform .22s ease, opacity .22s ease; }
        .luxury-page .lift:active { transform: scale(.985); opacity: .84; }
        @keyframes arrive { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .luxury-page .arrive { animation: arrive .45s ease both; }
        @media (min-width: 600px) { .luxury-page { max-width: 520px; margin: 0 auto; border-left: 1px solid ${palette.border}; border-right: 1px solid ${palette.border}; } }
      `}</style>

      <header style={{ padding: '17px 22px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)} className="lift" style={{ border: 0, background: 'transparent', padding: 5, display: 'grid', placeItems: 'center' }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: '.22em', fontWeight: 800 }}>OG EXPORTS</div>
          <div style={{ marginTop: 5, fontSize: 8, letterSpacing: '.19em', color: palette.muted }}>BUYER’S DESK</div>
        </div>
        <button aria-label="Open account and orders" onClick={() => setOrdersOpen(true)} className="lift" style={{ border: 0, background: 'transparent', padding: 5, display: 'grid', placeItems: 'center' }}>
          <UserRound size={19} strokeWidth={1.7} />
        </button>
      </header>

      {menuOpen && (
        <div className="arrive" style={{ margin: '0 20px 13px', padding: 15, border: `1px solid ${palette.border}`, borderRadius: 14, background: palette.card, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <button onClick={() => { setMenuOpen(false); browse(); }} style={{ background: 'none', border: 0, padding: 0 }}>Browse products</button>
          <button onClick={() => { setMenuOpen(false); setSupportOpen(true); }} style={{ background: 'none', border: 0, padding: 0 }}>Sourcing support</button>
          <button onClick={() => { setMenuOpen(false); setOrdersOpen(true); }} style={{ background: 'none', border: 0, padding: 0 }}>Your orders</button>
        </div>
      )}

      <div className="hide-scroll" style={{ display: 'flex', gap: 27, padding: '4px 22px 0', overflowX: 'auto', borderBottom: `1px solid ${palette.border}` }}>
        {['For you', 'Products', 'Worldwide'].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'Products') browse(); if (tab === 'Worldwide') setOrigin('Global'); if (tab === 'For you') { setCategory(''); setOrigin('Global'); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} style={{ height: 38, flexShrink: 0, padding: '0 0 9px', border: 0, borderBottom: activeTab === tab ? `2px solid ${palette.orange}` : '2px solid transparent', background: 'transparent', color: activeTab === tab ? palette.foreground : palette.muted, fontSize: 12, fontWeight: activeTab === tab ? 700 : 500 }}>
            {tab}
          </button>
        ))}
      </div>

      <section style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 9, color: palette.orange, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase' }}>Sourcing, with confidence</div>
        <h1 className="serif arrive" style={{ margin: '8px 0 8px', fontSize: 34, lineHeight: 1.08, maxWidth: 320 }}>A considered route<br />to Pakistani exports.</h1>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: palette.muted, margin: '0 0 17px', maxWidth: 310 }}>Find the right products. Start a conversation directly with our export team.</p>
        <form onSubmit={(event) => { event.preventDefault(); browse(search); }} style={{ display: 'flex', height: 48, alignItems: 'center', padding: '0 5px 0 13px', gap: 9, background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 12, boxShadow: '0 4px 16px rgba(40,56,51,.035)' }}>
          <Search size={17} color={palette.muted} />
          <input aria-label="Search products" placeholder="Search export products" value={search} onChange={(event) => setSearch(event.target.value)} style={{ width: '100%', minWidth: 0, border: 0, outline: 0, color: palette.foreground, fontSize: 12, background: 'transparent' }} />
          <button aria-label="Search catalogue" type="submit" className="lift" style={{ width: 38, height: 38, flexShrink: 0, border: 0, borderRadius: 9, background: palette.teal, color: palette.tealText, display: 'grid', placeItems: 'center' }}><ArrowRight size={17} /></button>
        </form>
      </section>

      <button onClick={() => { setOrigin('Pakistan'); browse(); }} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '12px 20px 17px', width: 'calc(100% - 40px)', minHeight: 39, padding: '0 12px', border: 0, borderRadius: 10, background: palette.lightGreen, textAlign: 'left' }}>
        <Globe2 size={15} color={palette.teal} />
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600 }}>Explore export-ready products from Pakistan</span>
        <ArrowRight size={14} color={palette.orange} />
      </button>

      <section style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: palette.orange, letterSpacing: '.16em', fontWeight: 800 }}>THE EXPORT EDIT</div>
            <h2 className="serif" style={{ fontSize: 23, margin: '4px 0 0', lineHeight: 1 }}>A few to begin with</h2>
          </div>
          <button onClick={() => browse()} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', padding: '4px 0', fontSize: 10, fontWeight: 700 }}>All products <ArrowUpRight size={13} color={palette.orange} /></button>
        </div>
        {products.length > 0 && (() => {
          const item = products[0];
          return <button onClick={() => browse(item.name)} className="lift" style={{ position: 'relative', display: 'block', width: '100%', height: 185, overflow: 'hidden', padding: 0, border: 0, borderRadius: 13, textAlign: 'left', background: palette.secondary }}>
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div className="image-fade" style={{ position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', left: 15, right: 14, bottom: 13, display: 'flex', alignItems: 'end', justifyContent: 'space-between', color: '#FDFDFB' }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: '.17em', opacity: .82, textTransform: 'uppercase' }}>{item.category}</div>
                <div className="serif" style={{ fontSize: 24, marginTop: 3 }}>{item.name}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 9, opacity: .9 }}><span>{item.origin}</span><span>{item.price}</span><span>MOQ {item.moq}</span></div>
              </div>
              <span style={{ width: 31, height: 31, border: '1px solid rgba(255,255,255,.55)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}><ArrowUpRight size={16} /></span>
            </div>
          </button>;
        })()}
      </section>

      <section id="catalogue" style={{ padding: '21px 20px 0', scrollMarginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: palette.orange, fontWeight: 800, letterSpacing: '.16em' }}>SOURCE WITH CLARITY</div>
            <h2 className="serif" style={{ margin: '4px 0 0', fontSize: 25, lineHeight: 1 }}>Worldwide picks</h2>
          </div>
          <button onClick={() => { setCategory(''); setOrigin('Global'); setSearch(''); showNotice('Showing the full product catalogue'); }} style={{ border: 0, background: 'transparent', fontSize: 10, fontWeight: 700, padding: '4px 0' }}>Reset <ArrowUpRight size={12} color={palette.orange} /></button>
        </div>
        <div className="hide-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '13px 0 12px' }}>
          {origins.map((item) => <button key={item} onClick={() => setOrigin(item)} style={{ flexShrink: 0, minHeight: 31, display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', borderRadius: 18, border: `1px solid ${origin === item ? palette.teal : palette.border}`, background: origin === item ? palette.lightGreen : palette.card, fontSize: 10, fontWeight: origin === item ? 700 : 500, color: origin === item ? palette.teal : palette.muted }}><MapPin size={12} />{item}</button>)}
        </div>
        {category && <div style={{ marginBottom: 10, fontSize: 10, color: palette.muted }}>Category: <strong>{category}</strong> <button onClick={() => setCategory('')} style={{ border: 0, background: 'transparent', color: palette.orange, fontWeight: 700 }}>Clear</button></div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map((item, index) => <button key={item.id} onClick={() => browse(item.name)} className="lift arrive" style={{ animationDelay: `${index * 60}ms`, border: `1px solid ${palette.border}`, borderRadius: 12, padding: 0, background: palette.card, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ height: 119, background: palette.secondary }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '10px 10px 11px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: palette.muted, letterSpacing: '.09em', textTransform: 'uppercase', minHeight: 12 }}>{item.category}</div>
              <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.3, fontWeight: 700, minHeight: 31 }}>{item.name}</div>
              <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 4, color: palette.muted, fontSize: 9 }}><MapPin size={10} />{item.origin}</div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: palette.teal }}>{item.price}</div>
              <div style={{ marginTop: 3, fontSize: 9, color: palette.muted }}>MOQ: {item.moq}</div>
            </div>
          </button>)}
        </div>
        {filtered.length === 0 && <div style={{ marginTop: 4, padding: 18, border: `1px solid ${palette.border}`, borderRadius: 12, background: palette.card, textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 21 }}>Nothing in this selection</div>
          <p style={{ margin: '6px 0 11px', color: palette.muted, fontSize: 11 }}>Try another search or clear the filters.</p>
          <button onClick={() => { setSearch(''); setCategory(''); setOrigin('Global'); }} style={{ border: 0, borderRadius: 8, padding: '9px 13px', color: palette.tealText, background: palette.teal, fontSize: 10 }}>Clear filters</button>
        </div>}
      </section>

      <section id="categories" style={{ padding: '23px 20px 0', scrollMarginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 10 }}>
          <div><div style={{ fontSize: 9, color: palette.orange, fontWeight: 800, letterSpacing: '.16em' }}>BROWSE BY TRADE</div><h2 className="serif" style={{ fontSize: 24, margin: '4px 0 0' }}>Explore categories</h2></div>
          <button onClick={() => { setCategory(''); browse(); }} style={{ border: 0, background: 'transparent', fontSize: 10, fontWeight: 700 }}>See all <ArrowUpRight size={12} color={palette.orange} /></button>
        </div>
        <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: 9 }}>
          {categories.map((item, index) => {
            const product = products.find((entry) => entry.category === item)!;
            return <button key={item} onClick={() => { setCategory(item); setActiveTab('Products'); document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' }); }} className="lift" style={{ position: 'relative', width: 137, height: 125, flexShrink: 0, overflow: 'hidden', padding: 0, borderRadius: 11, border: `1px solid ${palette.border}`, background: palette.secondary, textAlign: 'left' }}>
              <img src={product.image} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: '45% 0 0', background: 'linear-gradient(0deg, rgba(10,51,53,.77), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 9, display: 'flex', alignItems: 'end', justifyContent: 'space-between', color: '#FDFDFB' }}>
                <span style={{ fontSize: 11, fontWeight: 700, maxWidth: 100, lineHeight: 1.25 }}>{item}</span><ArrowUpRight size={14} color="#FDFDFB" />
              </div>
            </button>;
          })}
        </div>
      </section>

      <section style={{ padding: '20px 20px 0' }}>
        <div style={{ padding: 16, border: `1px solid ${palette.border}`, borderRadius: 13, background: palette.card }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: palette.lightGreen, color: palette.teal }}><MessageCircle size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>A sourcing question?</div>
              <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.5, color: palette.muted }}>Tell our team what you need. We’ll help you find a way forward.</div>
            </div>
            <button aria-label="Message OG Exports" onClick={() => setSupportOpen(true)} className="lift" style={{ width: 34, height: 34, border: 0, borderRadius: 10, display: 'grid', placeItems: 'center', background: palette.teal, color: palette.tealText }}><ArrowUpRight size={16} /></button>
          </div>
        </div>
      </section>

      <nav aria-label="Main navigation" style={{ position: 'fixed', zIndex: 5, bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 30px)', maxWidth: 490, minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '5px 5px', borderRadius: 22, border: `1px solid ${palette.border}`, background: 'rgba(253,253,251,.97)', boxShadow: '0 8px 28px rgba(40,56,51,.12)', backdropFilter: 'blur(12px)' }}>
        {navItems.map(({ label, Icon }) => {
          const isActive = (label === 'Home' && activeTab === 'For you') || (label === 'Categories' && activeTab === 'Categories') || (label === 'Messages' && activeTab === 'Messages');
          return <button key={label} onClick={() => chooseTab(label)} aria-label={label} className="lift" style={{ flex: 1, minWidth: 0, height: 50, border: 0, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: isActive ? palette.teal : palette.muted }}>
            <span style={{ width: 31, height: 27, display: 'grid', placeItems: 'center', borderRadius: 9, color: isActive ? palette.teal : palette.muted, background: isActive ? palette.lightGreen : 'transparent' }}><Icon size={17} strokeWidth={1.8} /></span>
            <span style={{ fontSize: 8, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{label}</span>
          </button>;
        })}
      </nav>

      {notice && <div role="status" className="arrive" style={{ position: 'fixed', zIndex: 8, bottom: 82, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 36px)', borderRadius: 10, padding: '11px 14px', background: palette.teal, color: palette.tealText, fontSize: 11, boxShadow: '0 6px 22px rgba(10,51,53,.18)' }}>{notice}</div>}

      {(supportOpen || ordersOpen) && <div role="presentation" onClick={() => { setSupportOpen(false); setOrdersOpen(false); }} style={{ position: 'fixed', zIndex: 10, inset: 0, background: 'rgba(18,34,32,.35)', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
        <section role="dialog" aria-modal="true" aria-label={supportOpen ? 'Sourcing support' : 'Buyer account'} onClick={(event) => event.stopPropagation()} className="arrive" style={{ width: '100%', maxWidth: 520, padding: '24px 22px 30px', background: palette.background, borderRadius: '20px 20px 0 0', boxShadow: '0 -10px 35px rgba(10,51,53,.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 9, color: palette.orange, fontWeight: 800, letterSpacing: '.16em' }}>{supportOpen ? 'OG EXPORTS · SOURCING DESK' : 'BUYER ACCOUNT'}</div>
              <h2 className="serif" style={{ margin: '6px 0 5px', fontSize: 27 }}>{supportOpen ? 'Let’s talk requirements.' : 'Your trade, in view.'}</h2>
            </div>
            <button aria-label="Close dialog" onClick={() => { setSupportOpen(false); setOrdersOpen(false); }} style={{ border: 0, background: palette.secondary, borderRadius: 9, width: 33, height: 33, display: 'grid', placeItems: 'center' }}><X size={17} /></button>
          </div>
          {supportOpen ? <>
            <p style={{ margin: '8px 0 15px', color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>Share a product, destination or specification with our team and we’ll help you take the next step.</p>
            <textarea aria-label="Your sourcing requirements" placeholder="What are you looking to source?" style={{ resize: 'vertical', width: '100%', minHeight: 83, padding: 12, border: `1px solid ${palette.border}`, borderRadius: 10, background: palette.card, color: palette.foreground, fontSize: 12, outlineColor: palette.teal }} />
            <button onClick={() => { setSupportOpen(false); showNotice('Your note is ready for the OG Exports team.'); }} style={{ width: '100%', height: 44, marginTop: 11, border: 0, borderRadius: 10, background: palette.teal, color: palette.tealText, fontSize: 12, fontWeight: 700 }}>Continue to messages <ArrowRight size={15} style={{ verticalAlign: 'middle', marginLeft: 5 }} /></button>
          </> : <>
            <p style={{ margin: '8px 0 15px', color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>Sign in to review active orders and continue your sourcing conversations.</p>
            <button onClick={() => { setOrdersOpen(false); showNotice('Sign-in is available in the full buyer app.'); }} style={{ width: '100%', height: 44, border: 0, borderRadius: 10, background: palette.teal, color: palette.tealText, fontSize: 12, fontWeight: 700 }}>Sign in to view orders <ChevronRight size={15} style={{ verticalAlign: 'middle', marginLeft: 5 }} /></button>
          </>}
        </section>
      </div>}
    </main>
  );
}
