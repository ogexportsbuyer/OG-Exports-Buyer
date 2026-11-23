import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getSavedToken } from '@/lib/api-config';
import { saveHtmlAsPdf } from '@/lib/pdf-export';

async function fetchAuthorizedFile(path: string, origin: string, mimeType: string) {
  if (!origin) throw new Error('The OG Exports file service is not configured for this app. Contact support.');
  const token = await getSavedToken();
  if (!token) throw new Error('Sign in again before opening this file.');

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const response = await fetch(url, {
    headers: { Accept: mimeType, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'The document could not be opened.');
  }
  return new Uint8Array(await response.arrayBuffer());
}

function safeFileName(name: string) {
  return name.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').slice(0, 70) || 'og-exports-document';
}

export async function shareInvestorFile(downloadUrl: string, name: string, origin: string, mimeType: string, extension: string, ensurePdf = false) {
  const contents = await fetchAuthorizedFile(downloadUrl, origin, mimeType);
  if (ensurePdf) {
    const signature = new TextDecoder().decode(contents.slice(0, 5));
    if (signature === '%PDF-') {
      mimeType = 'application/pdf';
      extension = 'pdf';
    } else {
      const text = new TextDecoder().decode(contents).replace(/^\uFEFF/, '').trimStart();
      if (!/^<(?:!doctype|html|head|body|table|div|section|main)\b/i.test(text)) {
        throw new Error('The investment download was not a PDF or printable report.');
      }
      await saveHtmlAsPdf(text, name, name);
      return;
    }
  }
  const fileName = safeFileName(name);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, `${fileName}.${extension}`);
  file.create({ overwrite: true });
  file.write(contents);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

export async function downloadAndSharePublicPdf(downloadUrl: string, name: string, origin: string) {
  if (!origin) throw new Error('The OG Exports file service is not configured for this app. Contact support.');
  const url = /^https?:\/\//i.test(downloadUrl)
    ? downloadUrl
    : `${origin.replace(/\/+$/, '')}/${downloadUrl.replace(/^\/+/, '')}`;
  const response = await fetch(url, { headers: { Accept: 'application/pdf' } });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'The product report could not be downloaded.');
  }

  const contents = new Uint8Array(await response.arrayBuffer());
  const header = new TextDecoder().decode(contents.slice(0, 1024));
  if (!header.includes('%PDF-')) throw new Error('The product report is not a valid PDF file.');

  const fileName = safeFileName(name);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const file = new File(Paths.cache, `${fileName}.pdf`);
  file.create({ overwrite: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error('PDF sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: name });
}

export async function openInvestorFile(path: string, name: string, origin: string, mimeType: string, extension: string) {
  // Reserve a browser tab on the click before awaiting the authenticated request.
  const popup = Platform.OS === 'web' ? window.open('', '_blank') : null;
  if (popup) {
    popup.document.title = 'Loading document…';
    popup.document.body.textContent = 'Loading document…';
  }

  try {
    const contents = await fetchAuthorizedFile(path, origin, mimeType);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
      if (!popup || popup.closed) {
        URL.revokeObjectURL(url);
        throw new Error('The document preview was blocked. Allow pop-ups and try again.');
      }
      popup.location.href = url;
      popup.document.title = name;
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return;
    }

    const file = new File(Paths.cache, `${safeFileName(name)}.${extension}`);
    file.create({ overwrite: true });
    file.write(contents);
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Document preview is not available on this device.');
    }
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
  } catch (error) {
    popup?.close();
    throw error;
  }
}