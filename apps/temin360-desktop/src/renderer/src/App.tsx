import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { AlertDialogProvider } from "./components/ui/AlertDialogProvider";
import { AccessibilityToolbar } from "./components/layout/AccessibilityToolbar";
import { SplashScreen } from "./components/splash/SplashScreen";
import { router } from "./routes";
import { setGlobalQueryClient } from "./utils/appEvents";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

setGlobalQueryClient(queryClient);

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return localStorage.getItem("temin_splash_enabled") !== "false";
  });

  useEffect(() => {
    const handleTriggerSplash = (): void => {
      setShowSplash(true);
    };
    window.addEventListener("show-splash-screen", handleTriggerSplash);
    return () =>
      window.removeEventListener("show-splash-screen", handleTriggerSplash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="dt-theme">
        <AlertDialogProvider>
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}

          <RouterProvider router={router} />
          <AccessibilityToolbar />
        </AlertDialogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
