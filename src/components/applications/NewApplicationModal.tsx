import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SECTORS = [
  "Petrochemicals", "Steel & Metals", "IT Services", "Infrastructure",
  "Financial Services", "Manufacturing", "Healthcare", "Real Estate",
  "Automotive", "Energy", "Telecommunications", "Consumer Goods",
];

export function NewApplicationModal({ open, onOpenChange, onSuccess }: NewApplicationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    sector: "",
    loan_amount: "",
    company_email: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.sector || !formData.loan_amount || !formData.company_email) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("applications").insert({
        user_id: user?.id || null,
        company_name: formData.company_name,
        cin: `U${Math.floor(10000 + Math.random() * 90000)}MH${new Date().getFullYear()}PLC${Math.floor(100000 + Math.random() * 900000)}`,
        sector: formData.sector,
        loan_amount: parseFloat(formData.loan_amount),
        company_email: formData.company_email,
        status: "Application Created",
        suggested_limit: `₹${formData.loan_amount} Cr`,
      });

      if (error) throw error;

      toast({ title: "Application Created", description: `${formData.company_name} loan application submitted successfully.` });
      
      setFormData({ company_name: "", sector: "", loan_amount: "", company_email: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating application:", error);
      toast({ title: "Error", description: error.message || "Failed to create application.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>New Loan Application</DialogTitle>
              <DialogDescription>Create a new corporate loan application</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e => handleChange("company_name", e.target.value)}
                placeholder="e.g., Reliance Industries Ltd"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector">Sector / Industry *</Label>
                <Select value={formData.sector} onValueChange={v => handleChange("sector", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="loan_amount">Loan Amount (₹ Cr) *</Label>
                <Input
                  id="loan_amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={e => handleChange("loan_amount", e.target.value)}
                  placeholder="e.g., 500"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Official Email ID *
              </Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={e => handleChange("company_email", e.target.value)}
                placeholder="e.g., finance@reliance.com"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Decision notifications and CAM will be sent to this email</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
