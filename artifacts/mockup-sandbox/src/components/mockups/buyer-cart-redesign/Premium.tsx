import React, { useRef, useState } from 'react';
import './_group.css';
import {
  amount,
  buyerCartItemMinimumQuantity,
  buyerGuestCartRow,
  BuyerProductImage,
  BuyerProductPrice,
  first,
  formatFobPrice,
  getGetBuyerCartQueryKey,
  list,
  messageOf,
  nextBuyerCartQuantity,
  parseBuyerCartQuantityInput,
  record,
  router,
  useAuth,
  useBuyerGuestFlow,
  useGetBuyerCart,
  useQueryClient,
  useRemoveBuyerCartItem,
  useUpdateBuyerCartItem,
} from './_preview-runtime';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Globe2,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

const text = (size: number, color: string, weight = 500, extra: React.CSSProperties = {}): React.CSSProperties => ({
  color, fontSize: size, fontWeight: weight, lineHeight: 1.45, ...extra,
});

function QuantityControl({
  itemId, name, quantity, minimumQuantity, disabled, onChangeQuantity,
}: {
  itemId: string;
  name: string;
  quantity: number;
  minimumQuantity: number;
  disabled: boolean;
  onChangeQuantity: (nextQuantity: number) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const lastSubmitted = useRef(String(quantity));
  const committing = useRef(false);

  async function commitQuantity(value: string) {
    const next = parseBuyerCartQuantityInput(value, minimumQuantity);
    const normalized = String(next);
    setDraft(normalized);
    if (normalized === lastSubmitted.current || committing.current) return;
    lastSubmitted.current = normalized;
    committing.current = true;
    const saved = await onChangeQuantity(next);
    committing.current = false;
    if (!saved) {
      lastSubmitted.current = String(quantity);
      setDraft(String(quantity));
    }
  }

  function step(delta: number) {
    if (disabled || committing.current) return;
    const current = parseBuyerCartQuantityInput(draft, minimumQuantity);
    void commitQuantity(String(nextBuyerCartQuantity(current, delta, minimumQuantity)));
  }

  const controlButton: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 11, border: '1px solid rgba(10,51,53,.15)',
    background: 'rgba(255,255,255,.54)', color: '#0A3335', display: 'grid',
    placeItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <button
        type="button" aria-label={`Decrease ${name} quantity`} data-testid={`buyer-cart-decrease-${itemId}`}
        disabled={disabled || quantity <= minimumQuantity} onClick={() => step(-1)}
        style={{ ...controlButton, opacity: disabled || quantity <= minimumQuantity ? .42 : 1 }}
      ><Minus size={14} /></button>
      <input
        aria-label={`${name} quantity`} aria-describedby={`moq-${itemId}`}
        data-testid={`buyer-cart-quantity-input-${itemId}`} value={draft} inputMode="numeric"
        disabled={disabled} maxLength={9}
        onChange={event => { if (event.target.value === '' || /^\d+$/.test(event.target.value)) setDraft(event.target.value); }}
        onBlur={() => void commitQuantity(draft)}
        onKeyDown={event => { if (event.key === 'Enter') { void commitQuantity(draft); (event.target as HTMLInputElement).blur(); } }}
        style={{
          width: 48, height: 34, borderRadius: 10, border: '1px solid rgba(10,51,53,.15)',
          background: 'rgba(255,255,255,.75)', textAlign: 'center', color: '#173b39',
          fontSize: 13, fontWeight: 700, outlineColor: '#0a6560',
        }}
      />
      <button
        type="button" aria-label={`Increase ${name} quantity`} data-testid={`buyer-cart-increase-${itemId}`}
        disabled={disabled} onClick={() => step(1)}
        style={{ ...controlButton, opacity: disabled ? .45 : 1 }}
      ><Plus size={14} /></button>
    </div>
  );
}

export function Premium() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const guestFlow = useBuyerGuestFlow();
  const cartQuery = useGetBuyerCart({ query: { queryKey: getGetBuyerCartQueryKey(), enabled: !!token, staleTime: 15_000 } });
  const updateItem = useUpdateBuyerCartItem();
  const removeItem = useRemoveBuyerCartItem();
  const cart = record(record(cartQuery.data).data);
  const items = token && !guestFlow.mergeError
    ? list(cart.items)
    : guestFlow.cart.length ? guestFlow.cart.map(buyerGuestCartRow) : list(cart.items);
  const cartCurrency = first(cart, ['currency', 'currency_code'], 'USD').toUpperCase();
  const [actionError, setActionError] = useState('');
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const attemptedMergeKey = React.useRef('');
  const guestMergeKey = guestFlow.cart.map(item => `${item.productId}:${item.quantity}`).join('|');
  React.useEffect(() => {
    if (!token || !guestFlow.ready || !guestFlow.cart.length || attemptedMergeKey.current === guestMergeKey) return;
    attemptedMergeKey.current = guestMergeKey;
    void guestFlow.mergeGuestCart().then(merged => {
      if (!merged) setActionError('Your saved guest cart could not be added to your account. Retry before checkout.');
    });
  }, [guestFlow.cart, guestFlow.mergeGuestCart, guestFlow.ready, guestMergeKey, token]);
  const waitingForGuestCart = Boolean(token && guestFlow.cart.length && !guestFlow.mergeError);
  const canRenderCart = !cartQuery.isLoading && !waitingForGuestCart && (!cartQuery.isError || (token && Boolean(guestFlow.mergeError)));
  const total = items.reduce((sum, item) => sum + (amount(item, ['qty']) ?? 0) * (amount(item, ['unit_price']) ?? 0), 0);
  const discountTotal = items.reduce((sum, item) => sum + (amount(item, ['qty']) ?? 0) * (amount(item, ['discount_amount_per_unit']) ?? 0), 0);
  const mutationPending = updateItem.isPending || removeItem.isPending || clearingAll || guestFlow.isMergingCart;

  async function changeQuantity(item: ReturnType<typeof record>, requestedQuantity: number): Promise<boolean> {
    const id = amount(item, ['id']);
    const minimum = buyerCartItemMinimumQuantity(item);
    const next = nextBuyerCartQuantity(requestedQuantity, 0, minimum);
    setActionError('');
    if (!token || String(item.id).startsWith('guest-')) {
      const productId = amount(item, ['product_id']);
      if (!productId) return false;
      try { await guestFlow.setGuestQuantity(productId, next); return true; }
      catch (error) { setActionError(messageOf(error)); return false; }
    }
    if (!id) return false;
    try {
      await updateItem.mutateAsync({ item: id, data: { qty: next } });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      return true;
    } catch (error) { setActionError(messageOf(error)); return false; }
  }

  async function deleteItem(item: ReturnType<typeof record>) {
    if (!token || String(item.id).startsWith('guest-')) {
      const productId = amount(item, ['product_id']);
      if (!productId) return;
      setActionError('');
      try { await guestFlow.removeGuestProduct(productId); }
      catch (error) { setActionError(messageOf(error)); }
      return;
    }
    const id = amount(item, ['id']);
    if (!id) return;
    setActionError('');
    try {
      await removeItem.mutateAsync({ item: id });
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
    } catch (error) { setActionError(messageOf(error)); }
  }

  async function clearCart() {
    if (!items.length) return;
    setActionError('');
    if (!token || items.every(item => String(item.id).startsWith('guest-'))) {
      try { await guestFlow.clearGuestCart(); setClearAllConfirm(false); }
      catch (error) { setActionError(messageOf(error)); }
      return;
    }
    setClearingAll(true);
    try {
      for (const item of items) {
        const id = amount(item, ['id']);
        if (id === null) throw new Error('A cart item is missing its server ID. Refresh the cart and try again.');
        await removeItem.mutateAsync({ item: id });
      }
      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      setClearAllConfirm(false);
    } catch (error) { setActionError(messageOf(error)); }
    finally { setClearingAll(false); }
  }

  const page: React.CSSProperties = {
    minHeight: '100vh', padding: '34px clamp(18px, 4vw, 64px) 72px',
    color: '#173b39', background:
      'radial-gradient(ellipse at 93% 2%, rgba(240,180,61,.17), transparent 27%), radial-gradient(ellipse at 3% 38%, rgba(123,190,178,.18), transparent 32%), #f7f5ee',
    fontFamily: '"DM Sans", "Avenir Next", sans-serif',
  };
  const shell: React.CSSProperties = { maxWidth: 1160, margin: '0 auto' };
  const glass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,.89), rgba(255,250,237,.76) 54%, rgba(225,241,235,.72))',
    border: '1px solid rgba(255,255,255,.92)', boxShadow: '0 16px 44px rgba(45,70,60,.085), inset 0 1px rgba(255,255,255,.7)',
    backdropFilter: 'blur(18px)', borderRadius: 20,
  };
  const buttonStyle: React.CSSProperties = {
    border: 0, borderRadius: 13, minHeight: 52, width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 11, background: '#0b3e3d', color: '#fffaf0',
    fontSize: 14, fontWeight: 700, letterSpacing: '.01em', cursor: mutationPending ? 'not-allowed' : 'pointer',
    boxShadow: '0 9px 22px rgba(11,62,61,.17)', opacity: mutationPending ? .55 : 1,
  };

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .og-cart-item { animation: riseIn .42s ease both; }
        .og-cart-item:nth-child(2) { animation-delay: .06s; }
        .og-cart-item:nth-child(3) { animation-delay: .12s; }
        .og-cart-action:hover { transform: translateY(-1px); }
        @media (max-width: 800px) { .og-cart-columns { grid-template-columns: 1fr !important; } .og-cart-summary { position: static !important; } }
        @media (max-width: 520px) { .og-cart-page { padding: 22px 15px 40px !important; } .og-product-layout { gap: 13px !important; } .og-product-image { width: 76px !important; height: 76px !important; } .og-line-bottom { align-items: flex-start !important; flex-direction: column !important; } }
      `}</style>
      <div className="og-cart-page" style={shell}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingBottom: 26, borderBottom: '1px solid rgba(10,51,53,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#0b4a48', background: 'rgba(10,87,81,.09)' }}><ShoppingBag size={19} strokeWidth={1.7} /></div>
            <div>
              <div style={{ ...text(10, '#8b7041', 700, { letterSpacing: '.19em', textTransform: 'uppercase' }) }}>OG Exports <span style={{ color: '#b89b63', margin: '0 5px' }}> / </span> Buyer desk</div>
              <div style={{ ...text(12, '#59706a', 500), marginTop: 2 }}>International trade, clearly arranged</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#506961', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            <ShieldCheck size={16} color="#887344" /> Secure order preparation
          </div>
        </header>

        <div style={{ padding: '34px 0 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24 }}>
          <div>
            <div style={{ ...text(10, '#9b7c42', 700, { letterSpacing: '.2em', textTransform: 'uppercase' }) }}>Order workspace · 01</div>
            <h1 style={{ margin: '8px 0 5px', font: '700 clamp(30px, 4vw, 43px)/1.08 Manrope, sans-serif', letterSpacing: '-.045em', color: '#173b39' }}>Your cart</h1>
            <div style={{ ...text(14, '#62756f', 500) }}>{items.length} {items.length === 1 ? 'product' : 'products'} selected for your export request</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 999, background: 'rgba(255,255,255,.53)', border: '1px solid rgba(10,51,53,.09)', color: '#55716c', fontSize: 11, whiteSpace: 'nowrap' }}>
            <Globe2 size={14} color="#9a7c42" /> FOB terms shown
          </div>
        </div>

        <div className="og-cart-columns" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 342px', alignItems: 'start', gap: 26 }}>
          <main>
            {!token && items.length > 0 ? (
              <div style={{ ...glass, display: 'flex', gap: 13, alignItems: 'flex-start', padding: '15px 17px', marginBottom: 15 }}>
                <div style={{ width: 31, height: 31, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(10,87,81,.1)', color: '#0b5551' }}><LockKeyhole size={15} /></div>
                <div>
                  <div style={text(13, '#1c4945', 700)}>Your cart is saved on this device.</div>
                  <div style={{ ...text(12, '#647872', 400), marginTop: 3 }}>You can browse and prepare your request now. Sign in or register only when you submit it.</div>
                </div>
              </div>
            ) : null}
            {actionError ? <div role="alert" style={{ ...glass, padding: 13, marginBottom: 13, color: '#a33c31', fontSize: 13 }}>{actionError}</div> : null}
            {token && (cartQuery.isLoading || waitingForGuestCart) ? (
              <div style={{ ...glass, padding: 25, marginBottom: 14 }}>
                <div style={{ height: 15, width: '40%', borderRadius: 8, background: 'rgba(10,51,53,.08)', marginBottom: 15 }} />
                <div style={{ height: 76, borderRadius: 12, background: 'rgba(10,51,53,.06)' }} />
                <p style={{ ...text(12, '#62756f'), marginBottom: 0 }}>{waitingForGuestCart ? 'Preparing your saved cart…' : 'Loading your cart…'}</p>
              </div>
            ) : null}
            {token && guestFlow.mergeError ? (
              <button type="button" onClick={() => void guestFlow.mergeGuestCart()} style={{ ...glass, width: '100%', padding: 13, marginBottom: 12, color: '#0b5551', fontWeight: 700, cursor: 'pointer' }} data-testid="buyer-cart-retry-merge">Retry cart sync</button>
            ) : null}
            {cartQuery.isError ? (
              <div style={{ ...glass, padding: 20, marginBottom: 14 }}>
                <div style={text(15, '#173b39', 700)}>Your cart could not be loaded.</div>
                <button type="button" onClick={() => void cartQuery.refetch()} style={{ marginTop: 12, border: '1px solid rgba(10,51,53,.16)', borderRadius: 10, padding: '10px 15px', background: 'rgba(255,255,255,.65)', color: '#0b5551', cursor: 'pointer' }}>Try again</button>
              </div>
            ) : null}
            {canRenderCart && items.length === 0 ? (
              <div style={{ ...glass, padding: '42px 24px', textAlign: 'center' }}>
                <div style={{ width: 58, height: 58, margin: '0 auto 16px', borderRadius: 20, display: 'grid', placeItems: 'center', background: 'rgba(10,87,81,.09)', color: '#0b5551' }}><ShoppingBag size={25} /></div>
                <div style={text(19, '#173b39', 700)}>Your cart is empty</div>
                <p style={{ ...text(13, '#667872'), maxWidth: 350, margin: '7px auto 18px' }}>Browse the approved product catalogue and add products to start an order.</p>
                <button type="button" onClick={() => router.push('/(buyer-tabs)/buyer-products')} style={{ ...buttonStyle, maxWidth: 220, margin: '0 auto' }}>Browse products <ArrowRight size={16} /></button>
              </div>
            ) : null}

            {canRenderCart && items.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 3px 11px' }}>
                  <div style={{ ...text(11, '#62756f', 700, { letterSpacing: '.12em', textTransform: 'uppercase' }) }}>Items for quotation <span style={{ color: '#a18751', marginLeft: 6 }}>{String(items.length).padStart(2, '0')}</span></div>
                  <button type="button" data-testid="buyer-cart-clear-all" disabled={mutationPending} onClick={() => { setActionError(''); setClearAllConfirm(true); }} style={{ border: 0, background: 'transparent', color: '#9b5146', font: '600 12px inherit', cursor: mutationPending ? 'not-allowed' : 'pointer', opacity: mutationPending ? .5 : 1 }}>Clear all</button>
                </div>
                {items.map((item, index) => {
                  const product = record(item.product);
                  const itemId = first(item, ['id'], `item-${index}`);
                  const minimum = buyerCartItemMinimumQuantity(item);
                  const quantity = amount(item, ['qty']) ?? minimum;
                  const unitPrice = amount(item, ['unit_price']) ?? 0;
                  const name = first(product, ['name'], first(item, ['product_name'], 'Export product'));
                  const imagePath = first(product, ['image_url', 'imageUrl', 'image_path', 'imagePath'], first(item, ['product_image_url', 'productImageUrl']));
                  const subtotal = quantity * unitPrice;
                  return (
                    <article className="og-cart-item" key={itemId} data-testid={`buyer-cart-item-${itemId}`} style={{ ...glass, padding: 18, marginBottom: 12, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 1, background: 'linear-gradient(90deg, transparent, rgba(196,162,91,.42), transparent)' }} />
                      <div className="og-product-layout" style={{ display: 'flex', gap: 17, alignItems: 'center' }}>
                        <div className="og-product-image" style={{ width: 98, height: 98, borderRadius: 15, overflow: 'hidden', flexShrink: 0, background: '#e0ebe6', boxShadow: 'inset 0 0 0 1px rgba(10,51,53,.08)' }}>
                          <BuyerProductImage uri={imagePath} label={`${name} product image`} style={{ width: '100%', height: '100%', borderRadius: 15 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ ...text(17, '#173b39', 700, { fontFamily: 'Manrope, sans-serif', letterSpacing: '-.025em', lineHeight: 1.25 }) }}>{name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, color: '#61756f', fontSize: 11 }}>
                                <Globe2 size={13} color="#a1844d" />
                                {first(product, ['origin'], 'Origin not specified')}{first(product, ['sku']) ? ` · ${first(product, ['sku'])}` : ''}
                              </div>
                            </div>
                            <button type="button" data-testid={`buyer-cart-remove-${itemId}`} aria-label={`Remove ${name} from cart`} disabled={mutationPending || Boolean(guestFlow.mergeError)} onClick={() => void deleteItem(item)} style={{ border: 0, width: 34, height: 34, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 10, color: '#9b5146', background: 'rgba(155,81,70,.06)', cursor: 'pointer', opacity: mutationPending ? .45 : 1 }}><Trash2 size={15} /></button>
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 10, padding: '5px 9px', borderRadius: 7, background: 'rgba(10,87,81,.07)', color: '#0b5551' }}>
                            <span style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 6, color: '#6c817a' }}>Unit</span>
                            <BuyerProductPrice product={item} compact />
                          </div>
                        </div>
                      </div>
                      <div className="og-line-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,51,53,.11)', marginTop: 17, paddingTop: 14, gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <QuantityControl key={`${itemId}:${quantity}`} itemId={itemId} name={name} quantity={quantity} minimumQuantity={minimum} disabled={mutationPending || Boolean(guestFlow.mergeError)} onChangeQuantity={next => changeQuantity(item, next)} />
                          <span id={`moq-${itemId}`} style={{ ...text(10, '#73837d', 600), whiteSpace: 'nowrap' }}>MOQ <b style={{ color: '#435e57' }}>{minimum}</b></span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ ...text(9, '#82918a', 700, { letterSpacing: '.15em', textTransform: 'uppercase' }) }}>Line total</div>
                          <div style={{ ...text(15, '#173b39', 700, { fontFamily: 'Manrope, sans-serif', marginTop: 3 }) }}>{subtotal > 0 ? formatFobPrice(subtotal, cartCurrency) : 'Quote required'}</div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {clearAllConfirm ? (
                  <div role="dialog" aria-label="Confirm clear cart" style={{ ...glass, padding: 17, margin: '3px 0 14px', borderColor: 'rgba(155,81,70,.24)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CircleHelp size={18} color="#9b5146" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div><div style={text(14, '#173b39', 700)}>Remove every item?</div><div style={{ ...text(12, '#667872'), marginTop: 3 }}>This will clear all {items.length} {items.length === 1 ? 'product' : 'products'} from your saved cart.</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
                      <button type="button" data-testid="buyer-cart-clear-cancel" disabled={clearingAll} onClick={() => setClearAllConfirm(false)} style={{ flex: 1, minHeight: 40, border: '1px solid rgba(10,51,53,.18)', borderRadius: 10, background: 'rgba(255,255,255,.62)', color: '#31544f', fontWeight: 700, cursor: 'pointer' }}>Keep cart</button>
                      <button type="button" data-testid="buyer-cart-clear-confirm" disabled={clearingAll} onClick={() => void clearCart()} style={{ flex: 1, minHeight: 40, border: 0, borderRadius: 10, background: '#9b5146', color: '#fff8ef', fontWeight: 700, cursor: 'pointer' }}>{clearingAll ? 'Clearing…' : 'Remove all'}</button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </main>

          {items.length > 0 ? (
            <aside className="og-cart-summary" style={{ ...glass, padding: 22, position: 'sticky', top: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(10,51,53,.12)' }}>
                <div style={{ ...text(10, '#917440', 700, { letterSpacing: '.17em', textTransform: 'uppercase' }) }}>Order summary</div>
                <span style={{ width: 29, height: 29, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'rgba(10,87,81,.08)', color: '#0b5551' }}><Check size={15} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '17px 0 14px' }}>
                <span style={text(13, '#61756f', 500)}>Estimated subtotal</span>
                <span style={{ ...text(14, '#173b39', 700), textAlign: 'right' }}>{total > 0 ? formatFobPrice(total, cartCurrency) : 'Final price by quotation'}</span>
              </div>
              {discountTotal > 0 ? <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '0 0 14px' }}><span style={text(12, '#8a7040', 600)}>Product discounts saved</span><span style={text(12, '#8a7040', 700)}>−{formatFobPrice(discountTotal, cartCurrency)}</span></div> : null}
              {items.some(item => (amount(item, ['unit_price']) ?? 0) <= 0) ? (
                <div style={{ display: 'flex', gap: 8, padding: '10px 11px', borderRadius: 10, background: 'rgba(240,180,61,.13)', color: '#7d6335', marginBottom: 13 }}>
                  <CircleHelp size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span style={text(11, '#7d6335', 600)}>Some items need a confirmed quotation.</span>
                </div>
              ) : null}
              <div style={{ borderTop: '1px dashed rgba(10,51,53,.2)', paddingTop: 15, marginTop: 2 }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 17 }}>
                  <ShieldCheck size={17} color="#8c7446" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ ...text(11, '#62756f', 500), lineHeight: 1.6, margin: 0 }}>Final pricing, freight and payment instructions are confirmed by OG Exports. <b style={{ color: '#345650', fontWeight: 700 }}>No payment is taken in this cart.</b></p>
                </div>
                <button type="button" data-testid="buyer-cart-checkout" className="og-cart-action" onClick={() => router.push('/buyer-checkout')} disabled={mutationPending} style={{ ...buttonStyle, transition: 'transform .18s ease' }}>
                  Continue to checkout <ArrowRight size={17} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 11, color: '#7b8c84', fontSize: 10 }}>
                  <LockKeyhole size={12} /> Request details, not a payment
                </div>
              </div>
              <div style={{ marginTop: 19, paddingTop: 15, borderTop: '1px solid rgba(10,51,53,.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#75867f', fontSize: 10 }}>
                <span>Trade desk support</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>FOB clarity <ChevronRight size={12} /></span>
              </div>
            </aside>
          ) : null}
        </div>

        {!cartQuery.isError ? (
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={() => router.push('/(buyer-tabs)/buyer-products')} style={{ border: 0, background: 'transparent', color: '#0b5551', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: 10, cursor: 'pointer' }}>
              Continue browsing products <ArrowRight size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
