import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ url, code, size = 200 }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-purple-500/20 animate-pop-in">
        <QRCodeSVG value={url} size={size} level="M" includeMargin={false} fgColor="#1a1a2e" bgColor="#ffffff" />
      </div>
      <div className="text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Join code</p>
        <p className="text-5xl font-black tracking-[0.15em] text-white animate-pulse-border rounded-xl px-4 py-2">
          {code}
        </p>
        <p className="text-white/50 text-xs mt-2 max-w-xs text-center">
          Scan the QR code or go to <span className="text-purple-300 font-mono">{window.location.host}/join</span> and enter the code above
        </p>
      </div>
    </div>
  );
}
