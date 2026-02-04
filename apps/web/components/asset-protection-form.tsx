"use client";

import { useState } from "react";
import { Lock, Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
import { useDataProtector } from "@/hooks/useDataProtector";

interface AssetProtectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (asset: {
    name: string;
    value: number;
    volatility: number;
    protectedDataAddress: string;
  }) => void;
}

type Step = "form" | "encrypting" | "success" | "error";

export function AssetProtectionForm({
  open,
  onOpenChange,
  onSubmit,
}: AssetProtectionFormProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [volatility, setVolatility] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMessage, setErrorMessage] = useState("");

  const { protectData, isLoading, isReady } = useDataProtector();

  const resetForm = () => {
    setName("");
    setValue("");
    setVolatility("");
    setStep("form");
    setErrorMessage("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isReady) {
      setErrorMessage("Please connect your wallet first");
      setStep("error");
      return;
    }

    setStep("encrypting");

    try {
      // Call real DataProtector to encrypt data
      const protectedData = await protectData(
        {
          value: parseFloat(value),
          volatility: parseFloat(volatility) / 100,
        },
        `Aegis Asset: ${name}`
      );

      setStep("success");

      // Wait a moment to show success, then submit
      setTimeout(() => {
        onSubmit({
          name,
          value: parseFloat(value),
          volatility: parseFloat(volatility) / 100,
          protectedDataAddress: protectedData.address,
        });
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("Protection failed:", err);
      setErrorMessage(err?.message || "Failed to encrypt data. Please try again.");
      setStep("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-aegis-steel-950 border-aegis-steel-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-aegis-cyan" />
            Protect Asset Data
          </DialogTitle>
          <DialogDescription>
            Your asset data will be encrypted using iExec DataProtector. Only
            TEE enclaves can access the decrypted values.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
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
                    Your wallet will sign a transaction to encrypt this data on
                    the iExec network. Only SGX enclaves can decrypt it.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-aegis-steel-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isReady || isLoading}
                className="bg-aegis-cyan hover:bg-aegis-cyan-light"
              >
                <Lock className="w-4 h-4 mr-2" />
                Encrypt & Protect
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "encrypting" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-aegis-cyan mx-auto animate-spin" />
            <div>
              <p className="font-medium text-aegis-steel-200">
                Encrypting Your Data...
              </p>
              <p className="text-sm text-aegis-steel-400 mt-2">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <div>
              <p className="font-medium text-aegis-steel-200">
                Data Protected Successfully!
              </p>
              <p className="text-sm text-aegis-steel-400 mt-2">
                Your asset data is now encrypted on iExec
              </p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="font-medium text-aegis-steel-200">
                Encryption Failed
              </p>
              <p className="text-sm text-red-400 mt-2">{errorMessage}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                className="border-aegis-steel-700"
              >
                Try Again
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
