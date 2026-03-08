import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SECTORS = [
  "Petrochemicals",
  "Steel & Metals",
  "IT Services",
  "Infrastructure",
  "Financial Services",
  "Manufacturing",
  "Healthcare",
  "Real Estate",
  "Automotive",
  "Energy",
  "Telecommunications",
  "Consumer Goods",
];

export function NewApplicationModal({ open, onOpenChange, onSuccess }: NewApplicationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    cin: "",
    sector: "",
    loan_amount: "",
    business_description: "",
    registered_address: "",
    contact_person: "",
    incorporation_year: "",
    promoter_group: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.sector || !formData.loan_amount) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("applications").insert({
        user_id: user?.id || null,
        company_name: formData.company_name,
        cin: formData.cin || `U${Math.floor(10000 + Math.random() * 90000)}MH${new Date().getFullYear()}PLC${Math.floor(100000 + Math.random() * 900000)}`,
        sector: formData.sector,
        loan_amount: parseFloat(formData.loan_amount),
        business_description: formData.business_description,
        registered_address: formData.registered_address,
        contact_person: formData.contact_person,
        incorporation_year: formData.incorporation_year,
        promoter_group: formData.promoter_group,
        status: "Application Created",
        suggested_limit: `₹${formData.loan_amount} Cr`,
      });

      if (error) throw error;

      toast({ title: "Application Created", description: `${formData.company_name} loan application submitted successfully.` });
      
      setFormData({
        company_name: "",
        cin: "",
        sector: "",
        loan_amount: "",
        business_description: "",
        registered_address: "",
        contact_person: "",
        incorporation_year: "",
        promoter_group: "",
      });
      
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e => handleChange("company_name", e.target.value)}
                placeholder="e.g., Reliance Industries Ltd"
                className="mt-1.5"
              />
            </div>

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

            <div>
              <Label htmlFor="cin">CIN (optional)</Label>
              <Input
                id="cin"
                value={formData.cin}
                onChange={e => handleChange("cin", e.target.value)}
                placeholder="Auto-generated if empty"
                className="mt-1.5 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="incorporation_year">Incorporation Year</Label>
              <Input
                id="incorporation_year"
                value={formData.incorporation_year}
                onChange={e => handleChange("incorporation_year", e.target.value)}
                placeholder="e.g., 1998"
                className="mt-1.5"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="registered_address">Registered Address</Label>
              <Input
                id="registered_address"
                value={formData.registered_address}
                onChange={e => handleChange("registered_address", e.target.value)}
                placeholder="e.g., Mumbai, Maharashtra"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={e => handleChange("contact_person", e.target.value)}
                placeholder="e.g., Rajesh Kumar"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="promoter_group">Promoter Group</Label>
              <Input
                id="promoter_group"
                value={formData.promoter_group}
                onChange={e => handleChange("promoter_group", e.target.value)}
                placeholder="e.g., Ambani Group"
                className="mt-1.5"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={e => handleChange("business_description", e.target.value)}
                placeholder="Brief description of business operations..."
                className="mt-1.5 min-h-[80px]"
              />
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
