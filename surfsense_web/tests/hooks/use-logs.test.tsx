/**
 * Regression tests for useLogs hook
 *
 * Critical Bug Fixed: Logs pagination was hardcoded to limit=5
 * This test ensures pagination works correctly with configurable limits.
 */
import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLogs } from '@/hooks/use-logs';
import { logsApiService } from '@/lib/apis/logs-api.service';

// Mock the logs API service
vi.mock('@/lib/apis/logs-api.service', () => ({
  logsApiService: {
    getLogs: vi.fn(),
    getLogSummary: vi.fn(),
  },
}));

describe('useLogs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should use default pagination of 20 logs when pagination parameter not provided', async () => {
    const mockLogs = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      level: 'INFO' as const,
      status: 'SUCCESS' as const,
      message: `Log message ${i + 1}`,
      created_at: new Date().toISOString(),
      search_space_id: 1,
    }));

    vi.mocked(logsApiService.getLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () => useLogs(1, {}),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify API was called with correct default pagination
    expect(logsApiService.getLogs).toHaveBeenCalledWith({
      queryParams: expect.objectContaining({
        search_space_id: 1,
        skip: 0,
        limit: 20, // Default should be 20, not 5
      }),
    });

    expect(result.current.logs).toHaveLength(20);
  });

  it('should support custom pagination with skip and limit', async () => {
    const mockLogs = Array.from({ length: 50 }, (_, i) => ({
      id: i + 21,
      level: 'INFO' as const,
      status: 'SUCCESS' as const,
      message: `Log message ${i + 21}`,
      created_at: new Date().toISOString(),
      search_space_id: 1,
    }));

    vi.mocked(logsApiService.getLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () => useLogs(1, {}, { skip: 20, limit: 50 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify API was called with custom pagination
    expect(logsApiService.getLogs).toHaveBeenCalledWith({
      queryParams: expect.objectContaining({
        search_space_id: 1,
        skip: 20,
        limit: 50,
      }),
    });
  });

  it('should support fetching more than 5 logs (regression test for critical bug)', async () => {
    // This test specifically verifies the bug is fixed where limit was hardcoded to 5
    const mockLogs = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      level: 'INFO' as const,
      status: 'SUCCESS' as const,
      message: `Log message ${i + 1}`,
      created_at: new Date().toISOString(),
      search_space_id: 1,
    }));

    vi.mocked(logsApiService.getLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () => useLogs(1, {}, { skip: 0, limit: 100 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // CRITICAL: Verify we can fetch MORE than 5 logs
    expect(logsApiService.getLogs).toHaveBeenCalledWith({
      queryParams: expect.objectContaining({
        limit: 100, // Should NOT be hardcoded to 5
      }),
    });

    expect(result.current.logs).toHaveLength(100);
  });

  it('should support pagination for second page', async () => {
    const mockLogs = Array.from({ length: 20 }, (_, i) => ({
      id: i + 21,
      level: 'INFO' as const,
      status: 'SUCCESS' as const,
      message: `Page 2 log ${i + 1}`,
      created_at: new Date().toISOString(),
      search_space_id: 1,
    }));

    vi.mocked(logsApiService.getLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () => useLogs(1, {}, { skip: 20, limit: 20 }), // Page 2
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(logsApiService.getLogs).toHaveBeenCalledWith({
      queryParams: expect.objectContaining({
        skip: 20,
        limit: 20,
      }),
    });
  });

  it('should combine pagination with filters', async () => {
    const mockLogs = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      level: 'ERROR' as const,
      status: 'FAILED' as const,
      message: `Error log ${i + 1}`,
      created_at: new Date().toISOString(),
      search_space_id: 1,
    }));

    vi.mocked(logsApiService.getLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () =>
        useLogs(
          1,
          { level: 'ERROR', status: 'FAILED' },
          { skip: 0, limit: 10 }
        ),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(logsApiService.getLogs).toHaveBeenCalledWith({
      queryParams: expect.objectContaining({
        search_space_id: 1,
        level: 'ERROR',
        status: 'FAILED',
        skip: 0,
        limit: 10,
      }),
    });
  });
});
