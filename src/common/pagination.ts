export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const buildPaginationMeta = (result: PaginatedResult<unknown>): PaginationMeta => {
  const pages = Math.max(1, Math.ceil(result.total / result.limit));

  return {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages,
  };
};
