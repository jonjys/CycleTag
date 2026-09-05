import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CycleTag - Free QR reorder labels'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f1e9',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            letterSpacing: '4px',
            color: '#8a8a8a',
            marginBottom: '40px',
          }}
        >
          CYCLETAG
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: '1.1',
          }}
        >
          Free QR reorder labels.
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            color: '#666',
            marginTop: '20px',
          }}
        >
          Scan. Reorder. Repeat.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
