export default class Network {
    static headers: Record<string, string> = {};

    static apiFetch(input: string | URL, init?: RequestInit) {
        return fetch(input, {
            ...init,
            headers: {
                ...(init ? init.headers : {}),
                ...Network.headers
            }
        });
    }

    static async apiJsonFetch<T>(input: string | URL, init?: RequestInit) {
        const result = await Network.apiFetch(input, {
            ...init,
            headers: {
                "Content-Type": "application/json"
            }
        });

        const jsonBody = await result.json();

        if (result.status >= 400) {
            throw jsonBody;
        }

        return jsonBody as T;
    }
}