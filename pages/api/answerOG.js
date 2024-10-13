import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message');
  const correctCount = searchParams.get('correctCount');
  const totalAnswered = searchParams.get('totalAnswered');
  const description = message || `Correct Answers: ${correctCount}\nTotal Answered: ${totalAnswered}`;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '32px',
          }}
        >
          {description}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new ImageResponse(
      (
        <div style={{ display: 'flex', backgroundColor: '#FF0000', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <h1>Error Generating Image</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
