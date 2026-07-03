'use client';
import useSWR from 'swr';
import { adminApi } from '../../lib/adminApi';
import { toast } from '../_components/Toast';

export interface DashboardData {
  range?: { days: number; from: string; to: string };
  counts: { users: number; destinations: number; reviews: number; itineraries: number };
  trends: { users: number; reviews: number };
  userGrowth: { date: string; count: number }[];
  reviewsOverTime: { date: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  topDestinations: { _id: string; name: string; rating: number; reviewCount: number; location?: { city?: string }; images?: string[] }[];
  destinationsByCategory: { category: string; count: number }[];
  recentUsers: { _id: string; name: string; email: string; createdAt: string; avatar?: string }[];
  recentReviews: { _id: string; user: { name: string }; destination: { name: string }; rating: number; createdAt: string }[];
}

const fetcher = async (key: string): Promise<DashboardData> => {
  const days = Number(key.split(':')[1]) || 30;
  const { data, error } = await adminApi.getStats({ days });
  if (error || !data) throw new Error(error || 'Không tải được dữ liệu');
  return data as DashboardData;
};

export function useAdminStats(days: number = 30) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    `admin/stats:${days}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      keepPreviousData: true,
      onError: (err) => {
        toast.error(err?.message || 'Lỗi tải thống kê admin');
      },
    },
  );

  return { stats: data, error, isLoading, isValidating, refresh: mutate };
}
