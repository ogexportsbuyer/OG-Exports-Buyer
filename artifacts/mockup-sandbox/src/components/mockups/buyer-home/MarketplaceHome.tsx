import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Grid2X2,
  Heart,
  Leaf,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Wheat,
  X,
} from 'lucide-react';
import './_group.css';

const products = [
  {
    name: 'Sesame Seeds',
    category: 'Seeds & Oilseeds',
    origin: 'Pakistan',
    price: 'USD 1,680',
    image: 'https://api.ogexports.co/product_images/sesame-seeds-1788251385-0-apy2t5.png',
    tag: 'Seeds & Oilseeds',
  },
  {
    name: 'Yellow Maize (Corn)',
    category: 'Grains',
    origin: 'Pakistan',
    price: 'USD 295',
    image: 'https://api.ogexports.co/product_images/yellow-maize-corn-1788251429-0-q5nyov.png',
    tag: 'Grains',
  },
  {
    name: 'Premium Basmati Rice',
    category: 'Rice',
    origin: 'Pakistan',
    price: 'USD 1,360',
    image: 'https://api.ogexports.co/product_images/premium-basmati-rice-1788251454-0-dj9bd7.png',
    tag: 'Rice',
  },
];

const categories = [
  { name: 'Fresh Produce', icon: Leaf, shade: 'sage' },
  { name: 'Grains', icon: Wheat, shade: 'wheat' },
  { name: 'Processed Food', icon: PackageCheck, shade: 'rose' },
  { name: 'Rice', icon: Sprout, shade: 'mint' },
  { name: 'Seeds & Oilseeds', icon: Sparkles, shade: 'sand' },
];

export function MarketplaceHome() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('Explore');
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = !activeCategory || product.category === activeCategory;
      const queryMatch =
        !term ||
        `${product.name} ${product.category} ${product.origin}`.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [query, activeCategory]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const toggleSaved = (name: string) => {
    setSaved((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
    showToast(saved.includes(name) ? 'Removed from your saved list' : 'Saved for later');
  };

  const goToProducts = () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="marketplace-shell min-h-[100dvh]">
      <style>{`
        .marketplace-shell {
          --ink: #183b35; --deep: #0b3936; --muted: #6e7d74; --paper: #f7f6f0;
          --line: #e5e3d9; --gold: #c5a56b; --sage: #dfe9df;
          min-height: 100dvh; background: var(--paper); color: var(--ink);
          font-family: "Avenir Next", Avenir, "Trebuchet MS", sans-serif;
          padding-bottom: 86px; position: relative; overflow: clip;
        }
        .marketplace-shell * { box-sizing: border-box; }
        .marketplace-page { width: min(100%, 760px); margin: 0 auto; padding: 0 21px 30px; }
        .topbar { height: 66px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(24,59,53,.1); position: relative; z-index: 5; }
        .brand-lockup { border: 0; background: none; display: inline-flex; align-items: center; gap: 9px; padding: 0; color: var(--ink); cursor: pointer; }
        .brand-mark { width: 31px; height: 31px; display: inline-flex; align-items: center; justify-content: center; position: relative; border: 1px solid var(--gold); border-radius: 50%; color: var(--deep); font: 700 10px Georgia, serif; letter-spacing: -.5px; }
        .brand-mark i { position: absolute; width: 5px; height: 5px; background: var(--gold); border-radius: 50%; top: -1px; right: 1px; }
        .brand-name { font-size: 12px; font-weight: 600; letter-spacing: 1.7px; }
        .brand-name b { font-weight: 400; color: #78847b; }
        .topbar-actions { display: flex; align-items: center; gap: 11px; }
        .icon-button { border: 0; background: transparent; color: var(--ink); padding: 7px; cursor: pointer; display: grid; place-items: center; }
        .buyer-pill { border: 1px solid var(--line); border-radius: 100px; background: #fbfaf6; color: var(--ink); padding: 4px 11px 4px 5px; display: flex; gap: 7px; align-items: center; font-size: 11px; font-weight: 600; cursor: pointer; }
        .buyer-avatar { display: grid; place-items: center; height: 23px; width: 23px; border-radius: 50%; background: #e4e9de; color: var(--deep); font: 700 11px Georgia, serif; }
        .menu-panel { position: absolute; z-index: 9; top: 58px; right: 20px; width: min(240px, calc(100vw - 40px)); border: 1px solid var(--line); border-radius: 14px; background: #fbfaf6; box-shadow: 0 14px 34px rgba(10,42,37,.15); padding: 6px; }
        .menu-panel button { width: 100%; border: 0; background: none; color: var(--ink); padding: 12px 10px; display: flex; align-items: center; gap: 10px; font: inherit; font-size: 12px; cursor: pointer; text-align: left; }
        .menu-panel button svg:last-child { margin-left: auto; color: #9ba69d; }
        .welcome-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 31px 1px 23px; }
        .eyebrow, .section-kicker { margin: 0; color: #83744f; font-size: 9px; font-weight: 700; letter-spacing: 1.75px; }
        .eyebrow { display: flex; align-items: center; gap: 7px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #b89c67; box-shadow: 0 0 0 3px rgba(184,156,103,.15); }
        .welcome-row h1 { font: 400 clamp(37px, 10vw, 53px)/.98 Georgia, "Times New Roman", serif; letter-spacing: -1.8px; margin: 14px 0 9px; color: #163b35; }
        .welcome-row h1 em { color: #94784e; font-weight: 400; }
        .welcome-copy { max-width: 268px; margin: 0; color: #758078; font-size: 12px; line-height: 1.55; }
        .welcome-stamp { margin: 0 2px 3px 0; width: 59px; height: 59px; border: 1px solid rgba(184,156,103,.62); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94784e; transform: rotate(8deg); flex-shrink: 0; }
        .welcome-stamp > span:first-child { font: 700 17px Georgia, serif; }
        .stamp-line { width: 28px; height: 1px; background: #c6ad7e; margin: 2px 0 3px; }
        .welcome-stamp small { font-size: 5px; font-weight: 700; line-height: 1.2; letter-spacing: 1px; text-align: center; }
        .search-card { background: #fffefa; padding: 11px; border: 1px solid #e8e5da; border-radius: 16px; box-shadow: 0 7px 22px rgba(24,59,53,.055); }
        .search-row { display: flex; height: 44px; align-items: center; gap: 10px; padding: 0 10px; color: #63766d; }
        .search-row input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: 12px; }
        .search-row input::placeholder { color: #a1a69e; }
        .filter-button, .clear-search { display: grid; place-items: center; background: transparent; border: 0; color: #62776d; padding: 5px; cursor: pointer; }
        .filter-button { border-left: 1px solid #ebe9e1; padding-left: 12px; }
        .clear-search { color: #9b9d94; }
        .search-submit { width: 100%; height: 41px; border: 0; border-radius: 10px; background: var(--deep); color: #fbfaf6; display: flex; justify-content: center; align-items: center; gap: 9px; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; transition: background .2s, transform .2s; }
        .search-submit:hover { background: #15534d; transform: translateY(-1px); }
        .search-foot { display: flex; align-items: center; gap: 5px; padding: 9px 2px 0; font-size: 9px; color: #829087; }
        .search-foot svg { color: #839b84; }
        .discovery-banner { height: 200px; margin-top: 23px; position: relative; overflow: hidden; border-radius: 17px; background: #0e4540; color: #f9f5e9; }
        .banner-copy { position: relative; z-index: 2; padding: 21px 20px; max-width: 61%; }
        .banner-kicker { display: flex; gap: 5px; align-items: center; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #d5bf8e; }
        .banner-copy h2 { font: 400 27px/.99 Georgia, serif; letter-spacing: -.5px; margin: 12px 0 7px; }
        .banner-copy p { color: #c5d2c4; font-size: 9px; line-height: 1.45; max-width: 170px; margin: 0 0 13px; }
        .banner-copy button { display: inline-flex; align-items: center; gap: 5px; border: 0; padding: 0; background: transparent; color: #e2c991; font: inherit; font-size: 10px; font-weight: 650; cursor: pointer; }
        .banner-art { position: absolute; inset: 0 0 0 48%; overflow: hidden; }
        .art-sun { position: absolute; right: 25px; top: 22px; width: 82px; height: 82px; border-radius: 50%; background: #c9aa6d; opacity: .96; }
        .art-hill { position: absolute; border-radius: 50% 50% 0 0 / 36% 39% 0 0; }
        .art-hill-back { width: 190px; height: 100px; right: -32px; bottom: 30px; background: #427465; transform: rotate(-8deg); }
        .art-hill-front { width: 230px; height: 98px; right: -52px; bottom: -2px; background: #1d5a4c; transform: rotate(8deg); }
        .art-stalk { position: absolute; z-index: 2; bottom: 17px; width: 2px; height: 99px; background: #dac796; transform-origin: bottom; }
        .stalk-one { right: 76px; transform: rotate(-15deg); }
        .stalk-two { right: 42px; height: 77px; transform: rotate(12deg); }
        .art-stalk i { position: absolute; width: 20px; height: 7px; border-radius: 100% 0 100% 0; background: #c8b37f; left: -17px; transform: rotate(-15deg); }
        .art-stalk i:nth-child(1) { top: 15px; }.art-stalk i:nth-child(2) { top: 31px; left: 1px; transform: scaleX(-1) rotate(-15deg); }
        .art-stalk i:nth-child(3) { top: 47px; }.art-stalk i:nth-child(4) { top: 63px; left: 1px; transform: scaleX(-1) rotate(-15deg); }
        .stalk-two i { width: 16px; height: 6px; }
        .art-seal { position: absolute; right: 18px; bottom: 13px; z-index: 3; color: rgba(250,245,226,.8); font: 700 11px Georgia, serif; text-align: center; letter-spacing: 1px; transform: rotate(-9deg); }
        .art-seal span { font: 600 4px "Avenir Next", sans-serif; letter-spacing: 1px; }
        .banner-index { position: absolute; bottom: 12px; left: 20px; z-index: 3; color: rgba(239,234,216,.7); font-size: 7px; letter-spacing: 1.3px; }
        .banner-index span { display: inline-block; height: 1px; width: 18px; background: #bfa675; margin: 0 5px 2px; }
        .category-section, .catalogue-section { padding-top: 31px; scroll-margin-top: 12px; }
        .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .section-kicker { font-size: 8px; letter-spacing: 1.45px; color: #93835e; margin-bottom: 5px; }
        .section-heading h2 { font: 400 23px/1.1 Georgia, serif; letter-spacing: -.45px; color: #1c4039; margin: 0; }
        .text-link { border: 0; background: transparent; padding: 5px 0 2px; color: #2c6558; display: flex; align-items: center; gap: 5px; font: inherit; font-size: 10px; font-weight: 650; cursor: pointer; white-space: nowrap; }
        .category-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .category-tile { min-height: 65px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 9px; text-align: left; padding: 10px; border: 1px solid transparent; border-radius: 12px; color: var(--ink); cursor: pointer; transition: transform .18s, border-color .18s, box-shadow .18s; }
        .category-tile:hover { transform: translateY(-2px); box-shadow: 0 5px 14px rgba(24,59,53,.08); }
        .category-tile.selected { border-color: #477a68; box-shadow: inset 0 0 0 1px #477a68; }
        .category-tile.sage { background: #e8ede2; }.category-tile.wheat { background: #f0eadb; }
        .category-tile.rose { background: #f0e8df; }.category-tile.mint { background: #e4eeea; }
        .category-tile.sand { background: #eee9dc; }
        .category-icon { width: 33px; height: 33px; flex-shrink: 0; display: grid; place-items: center; color: #356452; background: rgba(255,255,255,.48); border-radius: 10px; }
        .category-tile.wheat .category-icon, .category-tile.sand .category-icon { color: #947b4f; }
        .category-tile.rose .category-icon { color: #956f5d; }
        .category-name { max-width: 110px; font-size: 10px; font-weight: 650; line-height: 1.2; }
        .category-count { position: absolute; top: 7px; right: 8px; color: rgba(40,66,55,.38); font: 9px Georgia, serif; }
        .category-arrow { margin-left: auto; color: rgba(44,83,68,.54); align-self: flex-end; flex-shrink: 0; }
        .product-heading { margin-bottom: 8px; }
        .round-arrow { width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 50%; display: grid; place-items: center; background: #fbfaf6; color: var(--deep); cursor: pointer; transition: transform .2s; }
        .round-arrow:hover { transform: translateX(2px); }
        .catalogue-meta { display: flex; align-items: center; justify-content: space-between; color: #89948a; font-size: 9px; margin-bottom: 11px; }
        .origin-filter { display: flex; align-items: center; gap: 5px; color: #66766b; }
        .mini-flag { display: inline-grid; place-items: center; width: 15px; height: 12px; border-radius: 2px; background: #125546; color: #f5f3df; font: 700 6px Georgia, serif; letter-spacing: .2px; }
        .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .product-card { overflow: hidden; position: relative; background: #fffefa; border: 1px solid #e8e5db; border-radius: 13px; transition: transform .2s, box-shadow .2s; }
        .product-card:hover { transform: translateY(-3px); box-shadow: 0 9px 22px rgba(24,59,53,.1); }
        .save-button { position: absolute; z-index: 2; top: 9px; right: 9px; width: 29px; height: 29px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255,254,250,.92); color: #36574d; box-shadow: 0 2px 8px rgba(20,41,35,.1); cursor: pointer; }
        .save-button.is-saved { color: #a65e52; }
        .product-image-button { width: 100%; height: 121px; display: block; position: relative; overflow: hidden; padding: 0; border: 0; background: #ece9df; cursor: pointer; }
        .product-image-button img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }
        .product-card:hover .product-image-button img { transform: scale(1.04); }
        .image-origin { position: absolute; bottom: 7px; left: 7px; background: rgba(255,254,250,.94); border-radius: 20px; padding: 4px 6px; display: flex; gap: 4px; align-items: center; color: #50665b; font-size: 7px; }
        .image-origin .mini-flag { width: 12px; height: 9px; font-size: 5px; }
        .product-details { padding: 10px 10px 11px; }
        .product-category { margin: 0 0 4px; color: #a18c63; text-transform: uppercase; font-size: 7px; font-weight: 700; letter-spacing: .85px; }
        .product-details h3 { min-height: 31px; margin: 0; color: #203f38; font: 400 14px/1.12 Georgia, serif; letter-spacing: -.15px; }
        .product-price { margin-top: 9px; color: #1a5147; font-size: 11px; font-weight: 700; letter-spacing: .1px; }
        .quote-button { width: 100%; margin-top: 10px; min-height: 32px; padding: 0 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #dce4dc; border-radius: 7px; background: #f5f7f1; color: #29594c; font: inherit; font-size: 9px; font-weight: 650; cursor: pointer; transition: background .2s; }
        .quote-button:hover { background: #e7eee5; }
        .empty-catalogue { margin-top: 10px; min-height: 190px; background: #eeeee6; border: 1px dashed #d5d9cf; border-radius: 14px; padding: 25px 20px; text-align: center; display: flex; align-items: center; flex-direction: column; }
        .empty-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #dfe8dc; color: #416d5c; }
        .empty-catalogue h3 { font: 400 18px Georgia, serif; margin: 10px 0 5px; }
        .empty-catalogue p { max-width: 260px; margin: 0; color: #748177; font-size: 10px; line-height: 1.5; }
        .empty-catalogue button { border: 0; background: transparent; color: #2c6558; font: inherit; font-size: 10px; font-weight: 650; display: flex; gap: 5px; align-items: center; margin-top: 12px; cursor: pointer; }
        .trust-strip { display: flex; gap: 11px; align-items: center; margin-top: 25px; padding: 14px 13px; background: #e8eee7; border-radius: 12px; }
        .trust-icon { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; border-radius: 9px; background: #d6e3d7; color: #36644f; }
        .trust-strip strong { font: 400 14px Georgia, serif; color: #22483e; }
        .trust-strip p { margin: 3px 0 0; color: #718077; font-size: 9px; line-height: 1.45; }
        .trust-arrow { flex-shrink: 0; margin-left: auto; color: #6e8775; }
        .page-footer { display: flex; align-items: center; justify-content: space-between; padding: 22px 1px 5px; color: #879187; font-size: 8px; }
        .footer-brand { display: flex; align-items: center; gap: 8px; line-height: 1.45; }
        .brand-mark.small { width: 25px; height: 25px; font-size: 8px; flex-shrink: 0; }
        .footer-note { color: #a49a80; font: italic 11px Georgia, serif; }
        .bottom-nav { position: fixed; z-index: 10; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 760px); height: 70px; padding: 8px 18px max(8px, env(safe-area-inset-bottom)); display: flex; align-items: flex-start; justify-content: space-around; border-top: 1px solid rgba(24,59,53,.1); background: rgba(251,250,246,.96); backdrop-filter: blur(14px); }
        .bottom-nav button { position: relative; min-width: 55px; padding: 3px 7px; border: 0; background: transparent; color: #89958c; display: flex; flex-direction: column; gap: 4px; align-items: center; font: inherit; font-size: 8px; cursor: pointer; transition: color .2s; }
        .bottom-nav button.active { color: #164d43; font-weight: 700; }
        .bottom-nav button.active::before { content: ""; position: absolute; top: -9px; width: 20px; height: 2px; border-radius: 4px; background: #b79a65; }
        .saved-count { position: absolute; top: -1px; right: 6px; width: 14px; height: 14px; display: grid; place-items: center; border-radius: 50%; background: #b87b65; color: white; font: normal 8px sans-serif; }
        .toast-message { position: fixed; z-index: 20; left: 50%; bottom: 83px; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px); padding: 10px 14px; display: flex; align-items: center; gap: 7px; border: 1px solid rgba(255,255,255,.12); border-radius: 100px; background: #153d37; color: #f7f5ed; box-shadow: 0 8px 22px rgba(11,45,40,.22); font-size: 10px; animation: toast-in .2s ease-out; }
        .toast-message svg { color: #d3be8d; flex-shrink: 0; }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 7px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (min-width: 600px) {
          .marketplace-page { padding-left: 30px; padding-right: 30px; }
          .welcome-row { padding-top: 43px; padding-bottom: 30px; }
          .search-card { padding: 14px; }
          .discovery-banner { height: 230px; }
          .banner-copy { padding: 29px; }
          .banner-art { left: 52%; }
          .category-list { grid-template-columns: repeat(3, 1fr); }
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 13px; }
          .product-image-button { height: 155px; }
        }
        @media (max-width: 355px) {
          .marketplace-page { padding-left: 15px; padding-right: 15px; }
          .welcome-row h1 { font-size: 36px; }
          .welcome-stamp { width: 51px; height: 51px; }
          .category-list { gap: 6px; }
          .category-tile { gap: 6px; padding: 8px; }
          .category-icon { width: 29px; height: 29px; }
          .category-name { font-size: 9px; }
          .product-image-button { height: 105px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .marketplace-shell *, .marketplace-shell *::before, .marketplace-shell *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }
      `}</style>
      <div className="marketplace-page">
        <header className="topbar">
          <button className="brand-lockup" aria-label="OG Exports home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="brand-mark"><span>OG</span><i /></span>
            <span className="brand-name">OG <b>EXPORTS</b></span>
          </button>
          <div className="topbar-actions">
            <button className="icon-button menu-trigger" aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <button className="buyer-pill" onClick={() => showToast('Buyer account tools are ready to explore')}>
              <span className="buyer-avatar">B</span>
              <span>Buyer</span>
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="menu-panel">
            <button onClick={() => { setActiveTab('Orders'); setMenuOpen(false); showToast('Your order space is ready'); }}>
              <PackageCheck size={17} /> Orders <ChevronRight size={15} />
            </button>
            <button onClick={() => { setMenuOpen(false); showToast('Help from OG Exports'); }}>
              <CircleHelp size={17} /> Buyer support <ChevronRight size={15} />
            </button>
          </div>
        )}

        <section className="welcome-row">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> THE BUYER MARKETPLACE</p>
            <h1>Good trade<br /><em>starts here.</em></h1>
            <p className="welcome-copy">Discover export-ready products from Pakistan, all in one place.</p>
          </div>
          <div className="welcome-stamp" aria-hidden="true">
            <span>PK</span>
            <span className="stamp-line" />
            <small>ORIGIN<br />PAKISTAN</small>
          </div>
        </section>

        <section className="search-card" aria-label="Search the catalogue">
          <div className="search-row">
            <Search size={19} strokeWidth={2.1} />
            <input
              aria-label="Search products, categories or origin"
              placeholder="What are you looking for?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') goToProducts(); }}
            />
            {query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}
            <button className="filter-button" aria-label="Browse categories" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}>
              <SlidersHorizontal size={17} />
            </button>
          </div>
          <button className="search-submit" onClick={goToProducts}>Search catalogue <ArrowRight size={16} /></button>
          <div className="search-foot"><ShieldCheck size={13} /> Products published by OG Exports</div>
        </section>

        <section className="discovery-banner">
          <div className="banner-copy">
            <span className="banner-kicker"><Sparkles size={12} /> MADE TO DISCOVER</span>
            <h2>From harvest<br />to your hands.</h2>
            <p>Start with a product. Ask for a quote when you're ready.</p>
            <button onClick={goToProducts}>Explore products <ArrowUpRight size={15} /></button>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="art-sun" />
            <div className="art-hill art-hill-back" />
            <div className="art-hill art-hill-front" />
            <div className="art-stalk stalk-one"><i /><i /><i /><i /></div>
            <div className="art-stalk stalk-two"><i /><i /><i /></div>
            <div className="art-seal">OG<br /><span>EXPORTS</span></div>
          </div>
          <div className="banner-index">01 <span /> 03</div>
        </section>

        <section id="categories" className="category-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">A GOOD PLACE TO BEGIN</p>
              <h2>Shop by category</h2>
            </div>
            <button className="text-link" onClick={() => { setActiveCategory(''); goToProducts(); }}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="category-list">
            {categories.map(({ name, icon: Icon, shade }, index) => (
              <button
                className={`category-tile ${shade} ${activeCategory === name ? 'selected' : ''}`}
                key={name}
                onClick={() => {
                  setActiveCategory(activeCategory === name ? '' : name);
                  setTimeout(goToProducts, 20);
                }}
              >
                <span className="category-icon"><Icon size={19} strokeWidth={1.7} /></span>
                <span className="category-name">{name}</span>
                <span className="category-count">0{index + 1}</span>
                <ChevronRight className="category-arrow" size={15} />
              </button>
            ))}
          </div>
        </section>

        <section id="catalogue" className="catalogue-section">
          <div className="section-heading product-heading">
            <div>
              <p className="section-kicker">{activeCategory ? 'A CLOSER LOOK' : 'SELECTED FOR YOU'}</p>
              <h2>{activeCategory || 'Explore products'}</h2>
            </div>
            <button className="round-arrow" aria-label="Browse all products" onClick={() => { setActiveCategory(''); setQuery(''); }}>
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="catalogue-meta">
            <span>{filteredProducts.length ? `${filteredProducts.length} products` : 'Catalogue'}</span>
            <span className="origin-filter"><span className="mini-flag">PK</span> Pakistan <ChevronRight size={12} /></span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <article className={`product-card product-card-${index + 1}`} key={product.name}>
                  <button className={`save-button ${saved.includes(product.name) ? 'is-saved' : ''}`} aria-label={saved.includes(product.name) ? `Unsave ${product.name}` : `Save ${product.name}`} onClick={() => toggleSaved(product.name)}>
                    <Heart size={16} fill={saved.includes(product.name) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="product-image-button" onClick={() => showToast(`${product.name} product details`)}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <span className="image-origin"><span className="mini-flag">PK</span> Pakistan</span>
                  </button>
                  <div className="product-details">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <div className="product-price">{product.price}</div>
                    <button className="quote-button" onClick={() => showToast(`Quote request started for ${product.name}`)}>
                      Request a quote <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-catalogue">
              <span className="empty-icon"><Compass size={23} /></span>
              <h3>{query ? 'Nothing found just yet' : 'More to discover'}</h3>
              <p>{query ? 'Try another product or browse the categories.' : `No ${activeCategory} products are available in this catalogue yet.`}</p>
              <button onClick={() => { setQuery(''); setActiveCategory(''); }}>See all available products <ArrowRight size={14} /></button>
            </div>
          )}
        </section>

        <section className="trust-strip">
          <div className="trust-icon"><ShieldCheck size={19} /></div>
          <div>
            <strong>Trade with clarity.</strong>
            <p>Review product details, request a quote, and follow your orders with OG Exports.</p>
          </div>
          <ArrowDownRight className="trust-arrow" size={17} />
        </section>

        <footer className="page-footer">
          <div className="footer-brand"><span className="brand-mark small"><span>OG</span><i /></span><span>Exports from Pakistan,<br />for the world.</span></div>
          <span className="footer-note">A better way to source.</span>
        </footer>
      </div>

      <nav className="bottom-nav" aria-label="Marketplace navigation">
        {[
          { name: 'Explore', icon: Compass },
          { name: 'Categories', icon: Grid2X2 },
          { name: 'Saved', icon: Heart },
          { name: 'Orders', icon: PackageCheck },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={activeTab === name ? 'active' : ''}
            onClick={() => {
              setActiveTab(name);
              if (name === 'Explore') window.scrollTo({ top: 0, behavior: 'smooth' });
              if (name === 'Categories') document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
              if (name === 'Saved') showToast(saved.length ? `${saved.length} saved product${saved.length === 1 ? '' : 's'}` : 'Your saved products will appear here');
              if (name === 'Orders') showToast('Your order space is ready');
            }}
          >
            <Icon size={19} strokeWidth={activeTab === name ? 2.3 : 1.8} />
            <span>{name}</span>
            {name === 'Saved' && saved.length > 0 && <i className="saved-count">{saved.length}</i>}
          </button>
        ))}
      </nav>
      {toast && <div className="toast-message" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
