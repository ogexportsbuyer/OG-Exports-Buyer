export type BuyerCompanySetupTab = 'company' | 'verification' | 'contacts' | 'preferences';

export const BUYER_COMPANY_SETUP_STEPS: {
  id: BuyerCompanySetupTab;
  title: string;
  description: string;
  icon: 'briefcase' | 'shield' | 'users' | 'sliders';
}[] = [
  { id: 'company', title: 'Company', description: 'Confirm your registered business details.', icon: 'briefcase' },
  { id: 'verification', title: 'Verification', description: 'Upload the requested company records.', icon: 'shield' },
  { id: 'contacts', title: 'Contacts', description: 'Add a person OG Exports can reach.', icon: 'users' },
  { id: 'preferences', title: 'Trade preferences', description: 'Set your preferred terms for future requests.', icon: 'sliders' },
];

export function nextBuyerCompanySetupTab(tab: BuyerCompanySetupTab): BuyerCompanySetupTab | null {
  const index = BUYER_COMPANY_SETUP_STEPS.findIndex(step => step.id === tab);
  return index >= 0 ? BUYER_COMPANY_SETUP_STEPS[index + 1]?.id ?? null : null;
}

export function areBuyerCompanyVerificationDocumentsComplete(steps: unknown[]): boolean {
  return steps.length > 0 && steps.every(step => {
    if (typeof step !== 'object' || step === null || Array.isArray(step)) return false;
    const document = (step as Record<string, unknown>).document;
    if (typeof document !== 'object' || document === null || Array.isArray(document)) return false;
    const path = (document as Record<string, unknown>).path;
    return typeof path === 'string' && path.trim().length > 0;
  });
}
