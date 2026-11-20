import './_group.css';

const categories = ['Fresh Produce', 'Grains', 'Processed Food', 'Rice', 'Seeds & Oilseeds'];

const products = [
  {
    name: 'Sesame Seeds',
    category: 'Seeds & Oilseeds',
    origin: 'Pakistan',
    price: 'USD 1,680',
    image: 'https://api.ogexports.co/product_images/sesame-seeds-1788251385-0-apy2t5.png',
  },
  {
    name: 'Yellow Maize (Corn)',
    category: 'Grains',
    origin: 'Pakistan',
    price: 'USD 295',
    image: 'https://api.ogexports.co/product_images/yellow-maize-corn-1788251429-0-q5nyov.png',
  },
  {
    name: 'Premium Basmati Rice',
    category: 'Rice',
    origin: 'Pakistan',
    price: 'USD 1,360',
    image: 'https://api.ogexports.co/product_images/premium-basmati-rice-1788251454-0-dj9bd7.png',
  },
];

export function Current() {
  return (
    <main style={{ width: '100%', minHeight: '100vh', background: 'var(--og-background)', padding: '24px 20px 100px' }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--og-foreground)', fontSize: 25, fontWeight: 650, letterSpacing: '-0.3px' }}>Home</div>
        <div style={{ color: 'var(--og-muted)', fontSize: 14, marginTop: 5 }}>OG Exports products for global buyers</div>
      </header>

      <section style={{ background: 'var(--og-card)', border: '1px solid var(--og-border)', borderRadius: 18, padding: 20, marginBottom: 24, boxShadow: `0 10px 28px var(--og-shadow)` }}>
        <div style={{ color: 'var(--og-accent)', fontSize: 10, fontWeight: 700, letterSpacing: 1.4 }}>OG EXPORTS MARKETPLACE</div>
        <h1 style={{ color: 'var(--og-foreground)', fontSize: 24, lineHeight: 1.25, margin: '8px 0 0' }}>Find export products for your business.</h1>
        <p style={{ color: 'var(--og-muted)', fontSize: 13, lineHeight: 1.5, margin: '8px 0 16px' }}>
          Browse products published by OG Exports, request a quote, and follow orders in one place.
        </p>
        <label style={{ display: 'block', color: 'var(--og-foreground)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Search products</label>
        <input aria-label="Search products" placeholder="Product, category or origin" style={{ width: '100%', height: 48, border: '1px solid var(--og-border)', borderRadius: 10, padding: '0 14px', background: 'var(--og-card)', color: 'var(--og-foreground)', font: 'inherit', fontSize: 14 }} />
        <button style={{ width: '100%', height: 48, border: 0, borderRadius: 12, marginTop: 9, background: 'var(--og-primary)', color: 'var(--og-primary-foreground)', fontSize: 14, fontWeight: 650 }}>⌕ &nbsp; Search catalogue</button>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Shop by category</h2>
          <span style={{ color: 'var(--og-primary)', fontWeight: 700, fontSize: 12 }}>View all</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9, marginBottom: 22 }}>
          {categories.map(category => (
            <div key={category} style={{ minHeight: 60, display: 'flex', alignItems: 'center', border: '1px solid var(--og-border)', borderRadius: 15, background: 'var(--og-card)', padding: '10px 12px', fontWeight: 700, fontSize: 12 }}>
              {category}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Recommended products</h2>
          <span style={{ color: 'var(--og-primary)', fontWeight: 700, fontSize: 12 }}>Browse all</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflow: 'hidden', paddingBottom: 12 }}>
          {products.map(product => (
            <article key={product.name} style={{ flex: '0 0 208px', overflow: 'hidden', border: '1px solid var(--og-border)', borderRadius: 18, background: 'var(--og-card)', boxShadow: `0 8px 22px var(--og-shadow)` }}>
              <img src={product.image} alt={product.name} style={{ display: 'block', width: '100%', height: 118, objectFit: 'cover', background: 'var(--og-secondary)' }} />
              <div style={{ padding: 13 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{product.name}</div>
                <div style={{ color: 'var(--og-muted)', fontSize: 11, marginTop: 4 }}>{product.category} · {product.origin}</div>
                <div style={{ color: 'var(--og-primary)', fontSize: 12, fontWeight: 700, marginTop: 9 }}>{product.price}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
