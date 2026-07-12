import { QRCodeCanvas } from "qrcode.react";

interface Props {
  url: string;
}

export default function QRCodeDisplay({ url }: Props) {
  return <QRCodeCanvas value={url} size={120} />;
}
