import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>Trendova Hub</div>
        <div style={{ marginTop: 16, fontSize: 28, opacity: 0.9 }}>
          Stock Market Analysis & Insights
        </div>
      </div>
    ),
    size
  );
}
