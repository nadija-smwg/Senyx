'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useNotifications(options?: { 
  isRead?: boolean;
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (options?.isRead !== undefined) queryParams.append('isRead', options.isRead.toString());
  if (options?.page && options?.limit) queryParams.append('offset', ((options.page - 1) * options.limit).toString());
  if (options?.limit) queryParams.append('limit', options.limit.toString());
  if (options?.type) queryParams.append('type', options.type);
  if (options?.startDate) queryParams.append('startDate', options.startDate);
  if (options?.endDate) queryParams.append('endDate', options.endDate);
  
  const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Poll every 30 seconds
    revalidateOnFocus: true,
  });

interface Notification {
  id: string;
  isRead: boolean;
  [key: string]: any;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

  const markAsRead = async (id: string) => {
    try {
      // Optimistic UI update
      mutate((currentData: NotificationsResponse | undefined) => {
        if (!currentData) return currentData;
        const updatedNotifications = currentData.notifications.map((n: Notification) => 
          n.id === id ? { ...n, isRead: true } : n
        );
        return {
          ...currentData,
          notifications: updatedNotifications,
          unreadCount: Math.max(0, (currentData.unreadCount || 1) - 1)
        };
      }, false);

      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark as read');
      
      mutate(); // Re-fetch to sync
    } catch (err) {
      console.error(err);
      mutate(); // Re-fetch to revert optimistic update
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic UI update
      mutate((currentData: NotificationsResponse | undefined) => {
        if (!currentData) return currentData;
        const updatedNotifications = currentData.notifications.map((n: Notification) => ({ ...n, isRead: true }));
        return {
          ...currentData,
          notifications: updatedNotifications,
          unreadCount: 0
        };
      }, false);

      const res = await fetch(`/api/notifications/read-all`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');

      mutate(); // Re-fetch to sync
    } catch (err) {
      console.error(err);
      mutate(); // Re-fetch to revert optimistic update
    }
  };

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    markAsRead,
    markAllAsRead,
    mutate
  };
}
