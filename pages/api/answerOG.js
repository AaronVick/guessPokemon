import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  console.log('Received request to /api/answerOG');

  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message');
  const correctCount = searchParams.get('correctCount');
  const totalAnswered = searchParams.get('totalAnswered');

  console.log('Received parameters:', { message, correctCount, totalAnswered });

  try {
    console.log('Generating image response');
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            width: '100%',
            height: '100%',
            padding: '40px',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            fontSize: '32px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>{message}</h1>
          <p style={{ fontSize: '36px', marginBottom: '10px' }}>Your Progress:</p>
          <p>Correct Answers: {correctCount}</p>
          <p>Total Answered: {totalAnswered}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
    console.log('Image response generated successfully');
    return imageResponse;
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