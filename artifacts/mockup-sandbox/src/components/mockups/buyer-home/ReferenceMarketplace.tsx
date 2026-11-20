import React, { useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Globe2, Grid2X2, MapPin,
  MessageCircle, Package, Search, ShoppingCart, UserRound, X,
} from 'lucide-react';
import {
  EmptyState, ErrorState, LoadingCard,
  useAuth, useGetBuyerOrders, useGetProductCategories, useGetProducts,
  getGetBuyerOrdersQueryKey, getGetProductCategoriesQueryKey, getGetProductsQueryKey,
  rowsFromResponse, first, categoryName, displayPrice, displayOrderNumber,
  record, Status,
} from './_preview-runtime';

const tabs = ['For you', 'Products', 'Categories', 'Worldwide'];
export function ReferenceMarketplace() {
  const { ready, token, apiOrigin } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Worldwide');
  const [origin, setOrigin] = useState('Global');
  const [notice, setNotice] = useState('');
  const productsQuery = useGetProducts({ per_page: 8 }, { query: { queryKey: getGetProductsQueryKey({ per_page: 8 }), enabled: ready && !!apiOrigin, retry: false } });
  const categoriesQuery = useGetProductCategories({ query: { queryKey: getGetProductCategoriesQueryKey(), enabled: ready && !!apiOrigin, retry: false } });
  const ordersQuery = useGetBuyerOrders({ per_page: 10 }, { query: { queryKey: getGetBuyerOrdersQueryKey({ per_page: 10 }), enabled: ready && !!token && !!apiOrigin } });
  const products = rowsFromResponse(productsQuery.data);
  const categories = rowsFromResponse(categoriesQuery.data).map(row => first(row, ['name'])).filter(Boolean).slice(0, 8);
  const origins = ['Global', ...Array.from(new Set(products.map(row => first(row, ['origin'])).filter(Boolean)))];
  const matchingProducts = useMemo(
    () => products.filter(product => origin === 'Global' || first(product, ['origin']) === origin),
    [products, origin],
  );
  const featured = products.filter(product => record(product).featured === true);
  const heroProducts = (featured.length ? featured : products).slice(0, 3);
  const activeOrders = rowsFromResponse(ordersQuery.data).filter(order => !['completed', 'cancelled', 'delivered'].includes(first(order, ['status']).toLowerCase()));
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const browse = (term = '') => notify(term.trim() ? `Searching catalogue for “${term.trim()}”` : 'Opening the approved product catalogue');

  return (
    <div className="marketplace">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .marketplace{--ink:#183b39;--deep:#0a3335;--cream:#f5f3ed;--paper:#fffefa;--muted:#667571;--line:#e3e2db;--gold:#b99a64;min-height:100dvh;background:var(--cream);color:var(--ink);font-family:'DM Sans',sans-serif;padding-bottom:88px}
        .marketplace button{font:inherit;color:inherit;border:0;cursor:pointer}
        .market-head{background:var(--paper);padding:14px 16px 0;position:sticky;top:0;z-index:5;border-bottom:1px solid var(--line)}
        .brand-line{display:flex;align-items:center;justify-content:space-between;padding:2px 0 13px}
        .brand{display:flex;align-items:center;gap:10px}
        .brand-mark{width:34px;height:34px;background:var(--deep);color:#f5e9d2;display:grid;place-items:center;border-radius:11px}
        .brand-name{font:800 17px 'Manrope',sans-serif;letter-spacing:-.5px}
        .brand-sub{font-size:10px;color:var(--muted);margin-top:1px}
        .head-actions{display:flex;gap:5px}
        .icon-button{width:38px;height:38px;background:transparent;border-radius:12px;display:grid;place-items:center}
        .icon-button:active{background:#e9eeeb}
        .top-tabs{display:flex;gap:25px;overflow:auto;scrollbar-width:none}
        .top-tabs::-webkit-scrollbar,.hscroll::-webkit-scrollbar{display:none}
        .tab{flex:none;background:transparent;padding:10px 0 11px;font-size:12px;color:#63716c;border-bottom:3px solid transparent}
        .tab.active{color:var(--deep);font-weight:700;border-color:var(--gold)}
        .page{max-width:620px;margin:auto;padding:10px 14px 28px}
        .searchbar{display:flex;align-items:center;gap:9px;background:var(--paper);border:1px solid #c9a46a;border-radius:13px;padding:4px 5px 4px 12px;height:44px;box-shadow:0 3px 10px rgba(37,52,46,.04)}
        .searchbar input{font:500 13px 'DM Sans',sans-serif;border:0;outline:0;background:transparent;min-width:0;flex:1;color:var(--ink)}
        .searchbar input::placeholder{color:#8b9691}
        .search-go{height:36px;width:40px;background:var(--deep)!important;color:#f7f3e9!important;border-radius:9px;display:grid;place-items:center}
        .trustline{display:flex;align-items:center;gap:8px;margin:8px 0 12px;background:#ece9df;border-radius:10px;padding:8px 11px;color:var(--deep);font-size:10px;font-weight:600;min-height:34px}
        .trustline span{flex:1}
        .section-head{display:flex;align-items:end;justify-content:space-between;margin:0 1px 7px}
        .section-title{font:800 14px 'Manrope',sans-serif;letter-spacing:-.3px}
        .section-note{color:var(--muted);font-size:10px;margin-top:3px}
        .text-action{background:none!important;color:#316a64!important;font-size:11px;font-weight:700;padding:4px 0}
        .hscroll{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px 11px}
        .featured-row{gap:9px}
        .feature-card{flex:none;width:164px;overflow:hidden;text-align:left;background:var(--paper);border:1px solid var(--line);border-radius:13px;box-shadow:0 3px 9px rgba(33,47,42,.045)}
        .feature-image{height:88px;width:100%;display:block;object-fit:cover;background:#e6e3db}
        .feature-info{padding:7px 9px 8px}
        .feature-title-line{display:flex;align-items:center;justify-content:space-between;gap:5px}
        .feature-name{font:700 10px 'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .feature-meta{font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}
        .category-card{flex:none;width:137px;overflow:hidden;background:var(--paper);border:1px solid var(--line);border-radius:15px}
        .category-card img{width:100%;height:93px;display:block;object-fit:cover;background:#e9e6de}
        .category-name{min-height:48px;padding:8px 9px;display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:10px;font-weight:700;line-height:1.3}
        .origin-scroll{display:flex;gap:8px;overflow:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px 10px}
        .origin-chip{flex:none;background:var(--paper)!important;border:1px solid var(--line)!important;border-radius:22px;padding:7px 11px!important;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:600}
        .origin-chip.selected{border-color:#467970!important;background:#e3eeea!important;color:var(--deep)}
        .product-card{flex:none;width:144px;overflow:hidden;text-align:left;background:var(--paper);border:1px solid var(--line);border-radius:13px;box-shadow:0 3px 9px rgba(33,47,42,.04)}
        .product-card img{display:block;width:100%;height:91px;object-fit:cover;background:#e9e6de}
        .product-details{padding:7px 9px 9px}
        .featured-pill{display:inline-block;border-radius:8px;padding:3px 6px;background:#f2e8d4;color:#6e582d;font-size:8px;font-weight:700;margin-bottom:5px}
        .product-name{min-height:27px;font-size:10px;line-height:1.35;font-weight:700}
        .product-origin{font-size:9px;color:var(--muted);margin-top:3px}
        .product-price{font-size:10px;font-weight:700;margin-top:4px}
        .bottom-nav{position:fixed;z-index:8;bottom:0;left:0;right:0;background:rgba(255,254,250,.96);border-top:1px solid var(--line);padding:8px 9px calc(8px + env(safe-area-inset-bottom));display:flex;justify-content:space-around;box-shadow:0 -5px 20px rgba(28,46,40,.07);backdrop-filter:blur(14px)}
        .bottom-item{background:none!important;min-width:55px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:3px 5px!important;color:#67736e!important;font-size:9px}
        .bottom-item.current{color:var(--deep)!important;font-weight:700}
        .bottom-item.current .nav-icon{background:#e2ece8;border-radius:10px;padding:5px}
        .nav-icon{height:26px;display:grid;place-items:center}
        .orders-card,.help-card{padding:13px;background:var(--paper);border:1px solid var(--line);border-radius:15px;margin-bottom:9px}
        .orders-row{display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:12px;font-weight:700}
        .orders-sub{font-size:10px;color:var(--muted);margin-top:4px;font-weight:400}
        .help-card{display:flex;align-items:center;gap:10px;margin-top:16px}
        .help-icon{width:36px;height:36px;border-radius:12px;background:#e4eeea;display:grid;place-items:center;color:var(--deep);flex:none}
        .help-title{font-size:11px;font-weight:700}.help-sub{font-size:9px;line-height:1.4;color:var(--muted);margin-top:3px}
        .help-arrow{margin-left:auto;background:none!important;color:var(--deep)!important;padding:5px}
        .notice{position:fixed;z-index:11;left:50%;transform:translateX(-50%);bottom:80px;background:var(--deep);color:#fffaf0;padding:10px 14px;border-radius:11px;font-size:11px;box-shadow:0 6px 20px rgba(12,42,39,.2);white-space:nowrap}
        @media(min-width:600px){.market-head{padding-left:max(16px,calc((100vw - 620px)/2));padding-right:max(16px,calc((100vw - 620px)/2))}.bottom-nav{left:50%;right:auto;transform:translateX(-50%);width:100%;max-width:620px;border-radius:16px 16px 0 0}}
      `}</style>

      <header className="market-head">
        <div className="brand-line">
          <div className="brand">
            <div className="brand-mark"><Globe2 size={18}/></div>
            <div><div className="brand-name">OG Exports</div><div className="brand-sub">Pakistan export marketplace</div></div>
          </div>
          <div className="head-actions">
            <button className="icon-button" aria-label="Messages" onClick={() => notify('Messages with OG Exports')}><MessageCircle size={19}/></button>
            <button className="icon-button" aria-label="Cart" onClick={() => notify('Your quote cart')}><ShoppingCart size={19}/></button>
          </div>
        </div>
        <nav className="top-tabs" aria-label="Marketplace sections">
          {tabs.map(tab => <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => {
            setActiveTab(tab);
            if (tab === 'Worldwide' || tab === 'For you') setOrigin('Global');
            if (tab === 'Products' || tab === 'Categories') browse();
          }}>{tab}</button>)}
        </nav>
      </header>

      <main className="page">
        <form className="searchbar" onSubmit={event => { event.preventDefault(); browse(search); }}>
          <Search size={17} color="#75817c"/>
          <input aria-label="Search products" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search export products"/>
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')} style={{background:'transparent',padding:3,color:'#71807a'}}><X size={15}/></button>}
          <button className="search-go" aria-label="Search catalogue" type="submit"><ArrowRight size={18}/></button>
        </form>

        <button className="trustline" onClick={() => browse()} aria-label="Browse approved products from Pakistan">
          <Globe2 size={15}/><span>Approved products from Pakistan</span><ArrowRight size={14}/>
        </button>

        {heroProducts.length > 0 && <>
          <div className="section-head">
            <div><div className="section-title">Featured picks</div></div>
            <button className="text-action" onClick={() => browse()}>See all</button>
          </div>
          <div className="hscroll featured-row">
            {heroProducts.map((product,index) => {
              const name = first(product,['name'],'Export product');
              const image = first(product,['image_url','imageUrl']);
              return <button className="feature-card" key={first(product,['id'],String(index))} onClick={() => browse(name)} aria-label={`Browse ${name}`}>
                {image ? <img className="feature-image" src={image} alt={`${name} product`}/> : <div className="feature-image"/>}
                <div className="feature-info">
                  <div className="feature-title-line"><div className="feature-name">{name}</div><ArrowUpRight size={14}/></div>
                  <div className="feature-meta">{categoryName(product)} <span>·</span> {first(product,['origin'],'Origin not specified')}</div>
                </div>
              </button>;
            })}
          </div>
        </>}

        <div className="section-head" style={{marginTop:1}}><div><div className="section-title">Browse by origin</div></div><button className="text-action" onClick={() => setOrigin('Global')}>All origins</button></div>
        <div className="origin-scroll">
          {origins.map(country => <button key={country} className={`origin-chip ${origin === country ? 'selected' : ''}`} onClick={() => setOrigin(country)} aria-pressed={origin === country}>
            {country === 'Global' ? <Globe2 size={13}/> : <MapPin size={13}/>} {country}
          </button>)}
        </div>
        <div className="section-head"><div><div className="section-title">Worldwide picks for you</div></div><button className="text-action" onClick={() => browse()}>Browse all</button></div>
        {productsQuery.isLoading && <LoadingCard label="Loading products…"/>}
        {productsQuery.isError && <ErrorState message="Recommended products could not be loaded." error={productsQuery.error} onRetry={() => void productsQuery.refetch()}/>}
        {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && <EmptyState title="No products published" body="Approved products published by OG Exports will appear here." icon="package"/>}
        {!productsQuery.isLoading && !productsQuery.isError && matchingProducts.length === 0 && products.length > 0 && <EmptyState title={`No products from ${origin}`} body="Choose another origin to explore the current catalogue." icon="package"/>}
        <div className="hscroll">
          {matchingProducts.slice(0,8).map((product,index) => {
            const id = first(product,['id'],`product-${index}`);
            const name = first(product,['name'],'Export product');
            const image = first(product,['image_url','imageUrl']);
            return <button className="product-card" key={id} onClick={() => browse(name)} aria-label={`Browse ${name}`}>
              {image ? <img src={image} alt={`${name} product`}/> : <div style={{height:112,display:'grid',placeItems:'center',background:'#e9e6de'}}><Package size={22}/></div>}
              <div className="product-details">
                {record(product).featured === true && <div className="featured-pill">Featured</div>}
                <div className="product-name">{name}</div>
                <div className="product-origin">{first(product,['origin'],'Origin not specified')}</div>
                <div className="product-price">{displayPrice(product)}</div>
              </div>
            </button>;
          })}
        </div>

        <div className="section-head" style={{marginTop:7}}><div><div className="section-title">Explore by category</div><div className="section-note">Browse the catalogue by product type</div></div><button className="text-action" onClick={() => browse()}>See all <ArrowRight size={12} style={{verticalAlign:'middle'}}/></button></div>
        {!ready && <LoadingCard label="Connecting to the OG Exports catalogue…" lines={2}/>}
        {ready && !apiOrigin && <ErrorState message="The product catalogue is not connected. Please try again later."/>}
        {categoriesQuery.isLoading && <LoadingCard label="Loading categories…" lines={2}/>}
        {categoriesQuery.isError && <ErrorState message="Product categories could not be loaded." error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()}/>}
        {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 && <EmptyState title="No categories published" body="Categories will appear here when OG Exports publishes them." icon="grid"/>}
        <div className="hscroll">
          {categories.map(category => {
            const product = products.find(item => categoryName(item) === category);
            const image = product ? first(product,['image_url','imageUrl']) : '';
            return <button className="category-card" key={category} onClick={() => browse(category)} aria-label={`Browse ${category}`}>
              {image ? <img src={image} alt={`${category} product`}/> : <div style={{height:93,display:'grid',placeItems:'center',background:'#e3eeec'}}><Grid2X2 size={23}/></div>}
              <div className="category-name"><span>{category}</span><ArrowUpRight size={14}/></div>
            </button>;
          })}
        </div>

        {token && <>
          <div className="section-head" style={{marginTop:4}}><div><div className="section-title">Your active orders</div><div className="section-note">Keep track of your current orders</div></div><button className="text-action" onClick={() => notify('Opening your orders')}>View all</button></div>
          {ordersQuery.isLoading && <LoadingCard label="Loading orders…" lines={2}/>}
          {ordersQuery.isError && <ErrorState message="Your orders could not be loaded." error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()}/>}
          {!ordersQuery.isLoading && !ordersQuery.isError && activeOrders.length === 0 && <EmptyState title="No active orders" body="Orders placed from your cart will appear here." icon="package"/>}
          {activeOrders.slice(0,3).map(order => <div className="orders-card" key={first(order,['id'],displayOrderNumber(order))}><div className="orders-row"><div>{displayOrderNumber(order)}<div className="orders-sub">{first(order,['destination_port','destination'],'Destination pending')}</div></div><Status value={first(order,['status'],'Pending')}/></div></div>)}
        </>}

        <div className="help-card"><div className="help-icon"><MessageCircle size={18}/></div><div><div className="help-title">Need help with sourcing?</div><div className="help-sub">Message the OG Exports team about your requirements.</div></div><button className="help-arrow" aria-label="Message OG Exports" onClick={() => notify('Message the OG Exports team')}><ArrowUpRight size={18}/></button></div>
      </main>

      <nav className="bottom-nav" aria-label="Marketplace navigation">
        <button className="bottom-item current" onClick={() => {setActiveTab('For you');setOrigin('Global')}}><span className="nav-icon"><Globe2 size={19}/></span>Home</button>
        <button className="bottom-item" onClick={() => {setActiveTab('Categories');browse()}}><span className="nav-icon"><Grid2X2 size={19}/></span>Categories</button>
        <button className="bottom-item" onClick={() => notify('Messages with OG Exports')}><span className="nav-icon"><MessageCircle size={19}/></span>Messages</button>
        <button className="bottom-item" onClick={() => notify('Your quote cart')}><span className="nav-icon"><ShoppingCart size={19}/></span>Cart</button>
        <button className="bottom-item" onClick={() => notify(token ? 'Opening your account' : 'Sign in to access your account')}><span className="nav-icon"><UserRound size={19}/></span>Account</button>
      </nav>
      {notice && <div role="status" className="notice">{notice}</div>}
    </div>
  );
}
