import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Optional: Replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (safely wrapped for demo)
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase config not set, using mock telemetry.");
}

export type TelemetryEvent = {
  id: string;
  type: 'INTRUSION' | 'OFFLINE' | 'ACTIVE';
  sector: string;
  coordinates: [number, number]; // [longitude, latitude] for Mapbox
  timestamp: string;
  message: string;
};

// Mocked real-time listener for UI demo
export function useFirebaseTelemetry() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    // Simulated initial data
    const initialEvents: TelemetryEvent[] = [
      {
        id: 'EVT-101',
        type: 'ACTIVE',
        sector: 'Sector Alpha',
        coordinates: [77.2090, 28.6139],
        timestamp: new Date().toISOString(),
        message: 'All sensors operating nominally.'
      },
      {
        id: 'EVT-102',
        type: 'OFFLINE',
        sector: 'Sector Bravo',
        coordinates: [77.2100, 28.6250],
        timestamp: new Date(Date.now() - 300000).toISOString(),
        message: 'Sensor array B-2 offline.'
      }
    ];
    setEvents(initialEvents);

    // Simulate real-time intrusion
    const timer = setTimeout(() => {
      const intrusion: TelemetryEvent = {
        id: `EVT-${Date.now()}`,
        type: 'INTRUSION',
        sector: 'Sector Charlie',
        coordinates: [77.2205, 28.6105], // Mapbox uses [lng, lat]
        timestamp: new Date().toISOString(),
        message: 'Unauthorized movement detected in Restricted Zone.'
      };
      setEvents(prev => [intrusion, ...prev]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return events;
}
