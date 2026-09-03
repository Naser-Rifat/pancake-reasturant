"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldCheck } from "lucide-react";
import { adminLogin } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await adminLogin(username, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-white overflow-hidden">
      {/* Subtle Warm Ambient Background Lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-sm border-border/80 rounded-lg bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center pt-8 pb-6 space-y-3">
            <Link href="/" className="inline-block mx-auto transition-transform hover:scale-105">
              <Image
                src="/logo.png"
                alt="The Pancake Club"
                width={529}
                height={226}
                priority
                className="h-14 w-auto object-contain mx-auto"
              />
            </Link>
            <div className="space-y-1 pt-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Sign in to Admin
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Sign in with your staff account to manage orders &amp; settings
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={submit} className="grid gap-4">
              {/* Username */}
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    className="pl-9 h-11 text-sm bg-background/80"
                  />
                </div>
              </div>

              {/* Password with Eye Toggle */}
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pl-9 pr-10 h-11 text-sm bg-background/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2">
                  
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={busy}
                loading={busy}
                className="w-full h-11 text-sm font-semibold rounded-xl !text-white bg-zinc-900 hover:bg-zinc-800 shadow-xs mt-2 transition-all"
                style={{ color: "#ffffff" }}
              >
                {busy ? "Signing in..." : "Sign in to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Website Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to public website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
