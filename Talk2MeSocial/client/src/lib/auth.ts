import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  bio: string | null;
  profilePicture: string | null;
  isOnline: boolean;
  lastActive: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UpdateProfileData) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  fullName: string;
  email: string;
}

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
  bio?: string;
  profilePicture?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is already logged in
  const { data, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false
  });

  // Set user from query result
  useEffect(() => {
    if (data && typeof data === 'object') {
      setUser(data as User);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setLocation("/chat");
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return res.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setLocation("/chat");
      toast({
        title: "Account created",
        description: `Welcome to Talk2Me, ${userData.fullName}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", {});
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      setLocation("/");
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: UpdateProfileData) => {
      const res = await apiRequest("PATCH", "/api/user", userData);
      return res.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    },
  });

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      if (!user && currentPath !== "/" && !currentPath.startsWith("/register")) {
        setLocation("/");
      } else if (user && currentPath === "/") {
        setLocation("/chat");
      }
    }
  }, [user, isLoading, setLocation]);

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateProfile = async (userData: UpdateProfileData) => {
    await updateProfileMutation.mutateAsync(userData);
  };

  // Create the context value
  const contextValue = {
    user,
    loading: isLoading,
    login,
    register,
    logout,
    updateProfile
  };
  
  // Return the provider component
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
