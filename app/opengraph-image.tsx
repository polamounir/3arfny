import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'عرفني - للصراحة مكان';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
          borderRadius: '50px',
          color: 'white',
          fontSize: '120px',
          fontWeight: 'bold',
          marginBottom: '40px',
          boxShadow: '0 0 100px rgba(168,85,247,0.5)',
        }}>
          ع
        </div>
        
        <h1 style={{
          fontSize: '80px',
          fontWeight: '900',
          color: 'white',
          lineHeight: 1.1,
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          عرفني
        </h1>
        <p style={{
          fontSize: '40px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}>
          تلقى رسائل مجهولة بصدق وسرية
        </p>
      </div>
    ),
    { ...size }
  );
}
