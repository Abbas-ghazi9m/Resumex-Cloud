


"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { loginUser, registerUser } from "../../api";
import { User } from "../../types";
import { Lock, Mail, User as UserIcon, AlertCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("demo@resumex.cloud");
  const [password, setPassword] = useState("resumex2026");
  const [name, setName] = useState("Alexander Vance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Please enter your full name.");
        const res = await registerUser({ email, password, name });
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-10 w-10 rounded-[4px] bg-[#52664F] flex items-center justify-center text-white text-base font-semibold mb-3 shadow-sm">
            R
          </div>
          <h1 className="text-lg font-bold text-[#20211F] tracking-tight font-mono-tech uppercase">
            RESUMEX<span className="text-[#52664F]">-CLOUD</span>
          </h1>
          <p className="text-xs text-[#777872] mt-1 font-sans">
            Scan. Match. Optimize.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFFFF] border border-[#E8E6E0] rounded-[4px] p-6 shadow-sm">
          <div className="mb-5 pb-3 border-b border-[#E8E6E0]">
            <h2 className="text-sm font-semibold text-[#20211F]">
              {isRegister ? "Create Private Account" : "Platform Authentication"}
            </h2>
            <p className="text-xs text-[#777872] mt-0.5">
              {isRegister
                ? "Enter your credentials to register a tenant profile"
                : "Enter your verified credentials to access workspace"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[3px] bg-[#FDF2F1] border border-[#F5C7C3] flex items-start gap-2 text-xs text-[#9E2B23]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#20211F] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="h-3.5 w-3.5 absolute left-3 top-3 text-[#777872]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#20211F] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-3.5 w-3.5 absolute left-3 top-3 text-[#777872]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#20211F] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-3.5 w-3.5 absolute left-3 top-3 text-[#777872]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-2"
            >
              {isRegister ? "Register Account" : "Authenticate"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E8E6E0] text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[#52664F] hover:underline"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Need an account? Register new profile"}
            </button>
          </div>
        </div>

        {/* Security / Air-gapped badge */}
        <div className="mt-4 text-center text-[10px] font-mono-tech text-[#9E9F99]">
          SOC2 AIR-GAP VAULT • AES-256 ENCRYPTED STORAGE
        </div>
      </div>
    </div>
  );
}
