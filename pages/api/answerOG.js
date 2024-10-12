import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message') || 'Answer Feedback';
  const correctCount = searchParams.get('correctCount') || '0'; // Default to 0 if not provided
  const totalAnswered = searchParams.get('totalAnswered') || '0'; // Default to 0 if not provided

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            width: '100%',
            height: '100%',
            padding: '20px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>{message}</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating answer feedback:', error);
    return new ImageResponse(
      (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF0000', width: '100%', height: '100%' }}>
          <h1>Error Generating Feedback</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
