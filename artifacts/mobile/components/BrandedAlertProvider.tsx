import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  BrandedAlertDialog,
  type BrandedAlertDialogProps,
} from '@/components/BrandedAlertDialog';

type AlertRequest = Omit<BrandedAlertDialogProps, 'visible' | 'onClose'> & {
  id: number;
  onDismiss?: () => void;
};

type ShowBrandedAlertRequest = Omit<AlertRequest, 'id'>;

type BrandedAlertContextValue = {
  showAlert: (request: ShowBrandedAlertRequest) => void;
};

const BrandedAlertContext = createContext<BrandedAlertContextValue | null>(null);

export function BrandedAlertProvider({ children }: { children: React.ReactNode }) {
  const [activeAlert, setActiveAlert] = useState<AlertRequest | null>(null);
  const activeAlertRef = useRef<AlertRequest | null>(null);
  const pendingAlertsRef = useRef<AlertRequest[]>([]);
  const nextAlertId = useRef(0);
  const nextAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((request: ShowBrandedAlertRequest) => {
    const alert: AlertRequest = {
      ...request,
      id: ++nextAlertId.current,
      cancelable: request.cancelable ?? false,
      buttons: request.buttons.length
        ? request.buttons
        : [{ label: 'OK' }],
    };

    if (activeAlertRef.current) {
      pendingAlertsRef.current.push(alert);
      return;
    }

    activeAlertRef.current = alert;
    setActiveAlert(alert);
  }, []);

  const closeAlert = useCallback((id: number) => {
    const current = activeAlertRef.current;
    if (!current || current.id !== id) return;

    activeAlertRef.current = null;
    setActiveAlert(null);
    current.onDismiss?.();

    const next = pendingAlertsRef.current.shift();
    if (!next) return;

    if (nextAlertTimer.current) clearTimeout(nextAlertTimer.current);
    nextAlertTimer.current = setTimeout(() => {
      nextAlertTimer.current = null;
      if (activeAlertRef.current) {
        pendingAlertsRef.current.unshift(next);
        return;
      }
      activeAlertRef.current = next;
      setActiveAlert(next);
    }, 220);
  }, []);

  useEffect(() => () => {
    if (nextAlertTimer.current) clearTimeout(nextAlertTimer.current);
  }, []);

  const contextValue = React.useMemo(() => ({ showAlert }), [showAlert]);
  return (
    <BrandedAlertContext.Provider value={contextValue}>
      {children}
      {activeAlert ? (
        <BrandedAlertDialog
          key={activeAlert.id}
          visible
          title={activeAlert.title}
          message={activeAlert.message}
          tone={activeAlert.tone}
          buttons={activeAlert.buttons}
          cancelable={activeAlert.cancelable}
          onClose={() => closeAlert(activeAlert.id)}
        />
      ) : null}
    </BrandedAlertContext.Provider>
  );
}

export function useBrandedAlert() {
  const context = useContext(BrandedAlertContext);
  if (!context) {
    throw new Error('useBrandedAlert must be used within BrandedAlertProvider');
  }
  return context;
}
