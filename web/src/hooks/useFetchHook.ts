import { useCallback, useEffect, useRef, useState } from "react";

export interface HookFetchResponse<T> {
    data: T | null;
    error: unknown;
    loading: boolean;
    fetchData: (controller?: AbortController) => void;
}

export function useFetchHook<T>(url: string): HookFetchResponse<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<unknown | null>(null);
    const [loading, setLoading] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (controller?: AbortController) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();

            if (controller) {
                abortControllerRef.current = controller;
            } else {
                abortControllerRef.current = new AbortController();
            }
        }

        setLoading(true);

        try {
            const result = await fetch(url, {
                signal: controller?.signal,
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const body = await result.json() as T;

            setData(body);
            setError(null);
        } catch (err: unknown) {
            setError(err);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [url, setData, setError, setLoading]);

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller);

        return () => controller.abort();
    }, [fetchData]);

    return {
        data,
        error,
        loading,
        fetchData
    };
}