'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const OSMMap = dynamic(() => import('./OSMMap'), { ssr: false });

export default function MapSection() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    // Fetch a few top destinations for the homepage map
    const fetchDestinations = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/destinations?limit=10`);
        const data = await res.json();
        if (data.success && data.data) {
          setDestinations(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch destinations for map:', error);
      }
    };
    fetchDestinations();
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Khám phá trên Bản đồ</h2>
          <p className="mt-4 text-xl text-gray-600">Trải nghiệm du lịch thông qua OpenStreetMap</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-xl">
          <OSMMap destinations={destinations} />
        </div>
      </div>
    </section>
  );
}