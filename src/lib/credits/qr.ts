import "server-only";

import QRCode from "qrcode";

export async function qrDataUrlForLink(link: string): Promise<string> {
  return QRCode.toDataURL(link, { margin: 2, width: 320, errorCorrectionLevel: "M" });
}
