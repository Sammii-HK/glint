// async function safeFetch(url: string | URL | Request) {
//   const response = await fetch(url);
//   const contentType = response.headers.get("content-type");
//   if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
//   if (contentType && contentType.includes("application/json")) {
//     return response.json();
//   } else {
//     throw new Error("Received non-JSON response");
//   }
// }

// export { safeFetch };

export async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  const fullUrl = process.env.NEXT_PUBLIC_API_BASE ? `${process.env.NEXT_PUBLIC_API_BASE}${url}` : url;
  console.log(`🔍 Fetching URL: ${fullUrl}`);
  try {
    const response = await fetch(fullUrl, {
      ...options,
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...(options?.headers ?? {})
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SafeFetch: Request failed with status ${response.status} - ${errorText}`);
      return null;
    }
    const json = await response.json();
    console.log(`✅ SafeFetch: Successful response from ${fullUrl}`);
    return json as T;
  } catch (error) {
    console.error('❌ SafeFetch Error:', error);
    return null;
  }
}

// export { safeFetch };
