"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // tự động fetch api lại khi chuyển từ tab trang khác sang trang của mình
      refetchOnWindowFocus: false,

      //
      refetchOnMount: false,
    },
  },
});

export default function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
