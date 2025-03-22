/**
 * Talk2Me - Une application de messagerie en temps réel
 * Copyright © 2025 MIGUELITO DevCode
 * Tous droits réservés
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-selector";
import { SocketProvider } from "@/lib/socket";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import AuthPage from "@/pages/auth";
import ProfilePage from "@/pages/profile";
import SplashScreen from "@/components/splash-screen";
import { useState, useEffect } from "react";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch location={location}>
      <Route path="/" component={AuthPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // État pour suivre si l'animation de démarrage est terminée
  const [splashComplete, setSplashComplete] = useState(false);
  // État pour suivre si l'application est montée pour éviter l'hydratation côté serveur
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Évite les problèmes d'hydratation SSR
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {!splashComplete ? (
            <SplashScreen onComplete={() => setSplashComplete(true)} />
          ) : (
            <SocketProvider>
              <div className="fixed top-2 right-2 z-50">
                <ThemeToggle />
              </div>
              <Router />
              <Toaster />
            </SocketProvider>
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
