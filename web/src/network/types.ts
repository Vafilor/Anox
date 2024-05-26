export interface ApiError {
    error: {
        message: string;
    }
}

export interface PaginatedResponse<T> {
    results: T[];
    count: number;
    previous: string | null;
    next: string | null;
}

export interface SearchFilter {
    search?: string;
}

export interface PaginationFilter {
    ordering?: string;
    page?: number;
}

export interface GenericFilter {
    search: SearchFilter;
    pagination: PaginationFilter;
}

export interface Stringable {
    toString: () => string;
}