import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message');
  const correctCount = searchParams.get('correctCount');
  const totalAnswered = searchParams.get('totalAnswered');

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
        <p style={{ fontSize: '36px', marginBottom: '10px' }}>Correct Answers: {correctCount}</p>
        <p style={{ fontSize: '36px' }}>Total Answered: {totalAnswered}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
