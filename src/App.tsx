import Dashboard from './components/Dashboard';

// Replace with your Raspberry Pi camera stream URL:
//   HLS:  'http://<pi-ip>:8080/stream.m3u8'
//   MJPEG: 'http://<pi-ip>:8080/?action=stream'
const STREAM_URL: string | undefined = undefined;

export default function App() {
  return (
    <Dashboard
      // data={liveData}    {/* Pass real WebSocket data here */}
      streamUrl={STREAM_URL}
    />
  );
}
