"use client";

import { useState } from "react";
import { Lock, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssetProtectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (asset: { name: string; value: number; volatility: number }) => void;
}

export function AssetProtectionForm({
  open,
  onOpenChange,
  onSubmit,
}: AssetProtectionFormProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [volatility, setVolatility] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEncrypting(true);

    // Simulate encryption delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    onSubmit({
      name,
      value: parseFloat(value),
      volatility: parseFloat(volatility) / 100,
    });

    // Reset form
    setName("");
    setValue("");
    setVolatility("");
    setIsEncrypting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-aegis-steel-950 border-aegis-steel-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-aegis-cyan" />
            Protect Asset Data
          </DialogTitle>
          <DialogDescription>
            Your asset data will be encrypted using iExec DataProtector before
            any computation. Only TEE enclaves can access the decrypted values.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                placeholder="e.g., Commercial Real Estate"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-aegis-steel-900 border-aegis-steel-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Asset Value (USD)</Label>
              <Input
                id="value"
                type="number"
                placeholder="e.g., 1000000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-aegis-steel-900 border-aegis-steel-700"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volatility">Expected Volatility (%)</Label>
              <Input
                id="volatility"
                type="number"
                placeholder="e.g., 15"
                value={volatility}
                onChange={(e) => setVolatility(e.target.value)}
                className="bg-aegis-steel-900 border-aegis-steel-700"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <p className="text-xs text-aegis-steel-500">
                Annual volatility as a percentage (e.g., 15 for 15%)
              </p>
            </div>
          </div>

          <div className="bg-aegis-steel-900 rounded-lg p-4 border border-aegis-steel-800">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-aegis-cyan mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-aegis-steel-200">
                  Privacy Guarantee
                </p>
                <p className="text-aegis-steel-400 mt-1">
                  Your financial data is encrypted client-side and can only be
                  processed inside Intel SGX enclaves. No one—not even
                  iExec—can see your raw data.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-aegis-steel-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEncrypting}
              className="bg-aegis-cyan hover:bg-aegis-cyan-light"
            >
              {isEncrypting ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-pulse" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Encrypt & Protect
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
