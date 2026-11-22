export function pendingProductAuthReturnTo(productId: number): string | null {
  if (!Number.isSafeInteger(productId) || productId < 1) return null;
  return `/buyer-products?pendingProduct=${productId}`;
}

export function claimPendingBuyerProduct(
  pendingProduct: string | undefined,
  handled: { current: string },
): string | null {
  if (!pendingProduct || !/^\d+$/.test(pendingProduct) || Number(pendingProduct) < 1) return null;
  if (handled.current === pendingProduct) return null;
  handled.current = pendingProduct;
  return pendingProduct;
}

export function buyerCartRouteAfterProductAdd(added: boolean): '/buyer-cart' | null {
  return added ? '/buyer-cart' : null;
}
