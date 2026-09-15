export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '80px auto', padding: 24 }}>
      <h1>Lumia AI Backend</h1>
      <p>Backend service is online.</p>
      <p>
        API health: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
