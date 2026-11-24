import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerCartQueryKey,
  useAddBuyerCartItem,
  useGetBuyerCart,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { amount, first, list, messageOf, record } from '@/lib/data';
import { productMinimumQuantity } from '@/lib/buyer-cart-flow';
import {
  buildBuyerGuestCartMergeTargets,
  EMPTY_BUYER_GUEST_FLOW,
  isBuyerGuestFlowSnapshot,
  type BuyerGuestCartEntry,
  type BuyerGuestCheckoutDraft,
  type BuyerGuestFlowSnapshot,
  type BuyerGuestRfqDraft,
} from '@/lib/buyer-guest-flow';

const STORAGE_KEY = 'og-exports-buyer-guest-flow-v1';

type BuyerGuestFlowValue = {
  ready: boolean;
  cart: BuyerGuestCartEntry[];
  rfqDraft: BuyerGuestRfqDraft | null;
  checkoutDraft: BuyerGuestCheckoutDraft | null;
  isMergingCart: boolean;
  mergeError: string;
  addGuestProduct: (product: unknown) => Promise<void>;
  setGuestQuantity: (productId: number, quantity: number) => Promise<void>;
  removeGuestProduct: (productId: number) => Promise<void>;
  clearGuestCart: () => Promise<void>;
  mergeGuestCart: () => Promise<boolean>;
  saveRfqDraft: (draft: BuyerGuestRfqDraft) => Promise<void>;
  clearRfqDraft: () => Promise<void>;
  saveCheckoutDraft: (draft: BuyerGuestCheckoutDraft) => Promise<void>;
  clearCheckoutDraft: () => Promise<void>;
};

const BuyerGuestFlowContext = createContext<BuyerGuestFlowValue | null>(null);

export function BuyerGuestFlowProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, token, user } = useAuth();
  const queryClient = useQueryClient();
  const addCartItem = useAddBuyerCartItem();
  const [snapshot, setSnapshot] = useState<BuyerGuestFlowSnapshot>(EMPTY_BUYER_GUEST_FLOW);
  const [ready, setReady] = useState(false);
  const [isMergingCart, setIsMergingCart] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const snapshotRef = useRef(snapshot);
  const mergingRef = useRef(false);
  const resolveReadyRef = useRef<() => void>(() => undefined);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  if (!readyPromiseRef.current) {
    readyPromiseRef.current = new Promise<void>(resolve => { resolveReadyRef.current = resolve; });
  }

  const cartQuery = useGetBuyerCart({
    query: {
      queryKey: getGetBuyerCartQueryKey(),
      enabled: authReady && ready && Boolean(token),
      retry: false,
      staleTime: 0,
    },
  });

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!active || !raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isBuyerGuestFlowSnapshot(parsed)) {
          const next = { ...EMPTY_BUYER_GUEST_FLOW, ...parsed };
          snapshotRef.current = next;
          setSnapshot(next);
        }
      } catch {
        void AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
      }
    }).catch(() => undefined).finally(() => {
      if (!active) return;
      setReady(true);
      resolveReadyRef.current();
    });
    return () => { active = false; };
  }, []);

  const commit = useCallback(async (next: BuyerGuestFlowSnapshot) => {
    await readyPromiseRef.current;
    snapshotRef.current = next;
    setSnapshot(next);
    const serialized = JSON.stringify(next);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized));
    await writeQueueRef.current;
  }, []);

  const mutate = useCallback(async (update: (current: BuyerGuestFlowSnapshot) => BuyerGuestFlowSnapshot) => {
    await readyPromiseRef.current;
    const operation = mutationQueueRef.current
      .catch(() => undefined)
      .then(() => commit(update(snapshotRef.current)));
    mutationQueueRef.current = operation.catch(() => undefined);
    await operation;
  }, [commit]);

  const addGuestProduct = useCallback(async (rawProduct: unknown) => {
    await readyPromiseRef.current;
    const product = record(rawProduct);
    const productId = amount(product, ['id']);
    if (!productId || productId <= 0) throw new Error('This product is missing its catalogue ID.');
    await mutate(current => {
      if (mergingRef.current) throw new Error('Your saved cart is being prepared. Try adding this product again in a moment.');
      if (mergeError && current.mergeTargets) throw new Error('Retry syncing your saved cart before changing it.');
      const quantity = productMinimumQuantity(product);
      const exists = current.cart.find(item => item.productId === productId);
      const cart = exists
        ? current.cart.map(item => item.productId === productId
          ? { ...item, quantity: item.quantity + quantity, product }
          : item)
        : [...current.cart, { productId, quantity, product }];
      return { ...current, cart, mergeTargets: null, mergeOwner: null };
    });
  }, [mergeError, mutate]);

  const setGuestQuantity = useCallback(async (productId: number, quantity: number) => {
    await mutate(current => {
      if (mergingRef.current) throw new Error('Your saved cart is being prepared. Try again in a moment.');
      if (mergeError && current.mergeTargets) throw new Error('Retry syncing your saved cart before changing it.');
      const cart = current.cart.map(item => item.productId === productId
        ? { ...item, quantity: Math.max(productMinimumQuantity(item.product), Math.ceil(quantity)) }
        : item);
      return { ...current, cart, mergeTargets: null, mergeOwner: null };
    });
  }, [mergeError, mutate]);

  const removeGuestProduct = useCallback(async (productId: number) => {
    await mutate(current => {
      if (mergingRef.current) throw new Error('Your saved cart is being prepared. Try again in a moment.');
      if (mergeError && current.mergeTargets) throw new Error('Retry syncing your saved cart before changing it.');
      return {
        ...current,
        cart: current.cart.filter(item => item.productId !== productId),
        mergeTargets: null,
        mergeOwner: null,
      };
    });
  }, [mergeError, mutate]);

  const clearGuestCart = useCallback(async () => {
    await mutate(current => {
      if (mergingRef.current) throw new Error('Your saved cart is being prepared. Try again in a moment.');
      return { ...current, cart: [], mergeTargets: null, mergeOwner: null };
    });
    setMergeError('');
  }, [mutate]);

  const mergeGuestCart = useCallback(async () => {
    await readyPromiseRef.current;
    if (!token) return false;
    const current = snapshotRef.current;
    if (!current.cart.length) return true;
    if (mergingRef.current) return false;

    mergingRef.current = true;
    setIsMergingCart(true);
    setMergeError('');
    try {
      const accountId = first(record(user), ['id', 'user_id'], 'buyer');
      let targets = current.mergeTargets;
      if (!targets || current.mergeOwner !== accountId) {
        const response = await cartQuery.refetch();
        if (response.isError) throw response.error ?? new Error('Your account cart could not be loaded.');
        const serverCart = record(record(response.data).data);
        targets = buildBuyerGuestCartMergeTargets(current.cart, list(serverCart.items));
        await mutate(snapshot => ({ ...snapshot, mergeTargets: targets, mergeOwner: accountId }));
      }

      for (const item of current.cart) {
        const targetQuantity = targets[String(item.productId)];
        if (!Number.isFinite(targetQuantity) || targetQuantity < 1) {
          throw new Error('A saved product quantity is invalid. Refresh the cart and try again.');
        }
        await addCartItem.mutateAsync({
          data: { product_id: item.productId, qty: targetQuantity, replace: true },
        });
      }

      await queryClient.invalidateQueries({ queryKey: getGetBuyerCartQueryKey() });
      await mutate(snapshot => ({
        ...snapshot,
        cart: [],
        mergeTargets: null,
        mergeOwner: null,
      }));
      return true;
    } catch (error) {
      setMergeError(messageOf(error));
      return false;
    } finally {
      mergingRef.current = false;
      setIsMergingCart(false);
    }
  }, [addCartItem, cartQuery, mutate, queryClient, token, user]);

  const saveRfqDraft = useCallback(async (draft: BuyerGuestRfqDraft) => {
    await mutate(current => ({ ...current, rfqDraft: draft }));
  }, [mutate]);

  const clearRfqDraft = useCallback(async () => {
    await mutate(current => ({ ...current, rfqDraft: null }));
  }, [mutate]);

  const saveCheckoutDraft = useCallback(async (draft: BuyerGuestCheckoutDraft) => {
    await mutate(current => ({ ...current, checkoutDraft: draft }));
  }, [mutate]);

  const clearCheckoutDraft = useCallback(async () => {
    await mutate(current => ({ ...current, checkoutDraft: null }));
  }, [mutate]);

  const value = useMemo(() => ({
    ready,
    cart: snapshot.cart,
    rfqDraft: snapshot.rfqDraft,
    checkoutDraft: snapshot.checkoutDraft,
    isMergingCart,
    mergeError,
    addGuestProduct,
    setGuestQuantity,
    removeGuestProduct,
    clearGuestCart,
    mergeGuestCart,
    saveRfqDraft,
    clearRfqDraft,
    saveCheckoutDraft,
    clearCheckoutDraft,
  }), [
    ready,
    snapshot.cart,
    snapshot.rfqDraft,
    snapshot.checkoutDraft,
    isMergingCart,
    mergeError,
    addGuestProduct,
    setGuestQuantity,
    removeGuestProduct,
    clearGuestCart,
    mergeGuestCart,
    saveRfqDraft,
    clearRfqDraft,
    saveCheckoutDraft,
    clearCheckoutDraft,
  ]);

  return <BuyerGuestFlowContext.Provider value={value}>{children}</BuyerGuestFlowContext.Provider>;
}

export function useBuyerGuestFlow() {
  const value = useContext(BuyerGuestFlowContext);
  if (!value) throw new Error('useBuyerGuestFlow must be used within BuyerGuestFlowProvider');
  return value;
}
