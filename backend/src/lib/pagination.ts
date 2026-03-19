import { z } from 'zod'

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total?: number
  }
}

export function buildPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  total?: number,
): PaginatedResponse<T> {
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null

  return {
    data,
    pagination: {
      nextCursor,
      hasMore,
      total,
    },
  }
}
