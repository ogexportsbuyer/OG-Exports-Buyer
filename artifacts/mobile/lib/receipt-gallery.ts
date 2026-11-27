export type ReceiptGalleryPermission = {
  granted: boolean;
  canAskAgain: boolean;
};

export type ReceiptGalleryApi = {
  getPermission: () => Promise<ReceiptGalleryPermission>;
  requestPermission: () => Promise<ReceiptGalleryPermission>;
  saveImage: (localUri: string) => Promise<void>;
};

export type ReceiptGallerySaveResult = 'saved' | 'permission-denied' | 'permission-blocked';

export async function saveReceiptImageToGallery(
  captureImage: () => Promise<string>,
  gallery: ReceiptGalleryApi,
): Promise<ReceiptGallerySaveResult> {
  const current = await gallery.getPermission();
  if (!current.granted && !current.canAskAgain) return 'permission-blocked';
  const permission = current.granted ? current : await gallery.requestPermission();
  if (!permission.granted) {
    return permission.canAskAgain ? 'permission-denied' : 'permission-blocked';
  }

  const localUri = (await captureImage()).trim();
  if (!localUri) throw new Error('Receipt image capture returned an empty file path.');
  await gallery.saveImage(localUri);
  return 'saved';
}
