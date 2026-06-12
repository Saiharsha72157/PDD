import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type User = {
  id: string;
  email: string;
  mobile?: string;
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, mobile: string, password: string, fullName: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyOtp: (email: string, token: string, type: "signup" | "recovery") => Promise<void>;
  resendOtp: (email: string, type: "signup") => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const ignoreSessionChange = useRef(false);

  useEffect(() => {
    // Load session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !ignoreSessionChange.current) {
        mapSupabaseUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignoreSessionChange.current) {
        return;
      }
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const mapSupabaseUser = async (supabaseUser: SupabaseUser) => {
    // 1. Set initial details from user authentication metadata
    const initialUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      mobile: supabaseUser.user_metadata?.mobile || "",
      username: supabaseUser.user_metadata?.username || "",
      fullName: supabaseUser.user_metadata?.fullName || "",
      bio: "",
      avatarUrl: "",
    };
    setUser(initialUser);

    // 2. Fetch extended profile from Supabase database 'profiles' table
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, full_name, mobile, bio, avatar_url")
        .eq("id", supabaseUser.id)
        .single();

      if (data) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          mobile: data.mobile || supabaseUser.user_metadata?.mobile || "",
          username: data.username || supabaseUser.user_metadata?.username || "",
          fullName: data.full_name || supabaseUser.user_metadata?.fullName || "",
          bio: data.bio || "",
          avatarUrl: data.avatar_url || "",
        });
      }
    } catch (err) {
      console.warn("[AUTH] Profiles table select error (falling back to user_metadata):", err);
    }
  };

  const login = async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error(signInError.message);
    }
  };

  const register = async (email: string, mobile: string, password: string, fullName: string, username: string) => {
    try {
      ignoreSessionChange.current = true;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            mobile,
            fullName,
            username,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Supabase's signUp automatically creates a session if email confirmation is disabled.
      // We immediately sign out to prevent auto-logging in the user upon registration.
      await supabase.auth.signOut();
    } finally {
      // Delay resetting the ignore flag to allow auth events to settle
      setTimeout(() => {
        ignoreSessionChange.current = false;
      }, 800);
    }
  };



  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error", error);
    } else {
      setUser(null);
    }
    ignoreSessionChange.current = false;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  };

  const verifyOtp = async (email: string, token: string, type: "signup" | "recovery") => {
    if (type === "recovery") {
      ignoreSessionChange.current = true;
    }
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (error) {
      if (type === "recovery") {
        ignoreSessionChange.current = false;
      }
      throw new Error(error.message);
    }
  };

  const resendOtp = async (email: string, type: "signup") => {
    const { error } = await supabase.auth.resend({
      type,
      email,
    });
    if (error) {
      throw new Error(error.message);
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await mapSupabaseUser(session.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, refreshProfile, verifyOtp, resendOtp, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
