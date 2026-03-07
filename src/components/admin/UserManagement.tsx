import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Search, Mail, Shield, CheckCircle, XCircle, Trash2, Edit, Ban, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  department: string;
}

const initialUsers: User[] = [
  { id: 1, name: "Rajesh Kumar", email: "rajesh.kumar@intellicredit.com", role: "Admin", status: "Active", lastLogin: "2 hours ago", department: "Credit Risk" },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@intellicredit.com", role: "Credit Officer", status: "Active", lastLogin: "1 hour ago", department: "Corporate Banking" },
  { id: 3, name: "Amit Patel", email: "amit.patel@intellicredit.com", role: "Credit Officer", status: "Active", lastLogin: "30 min ago", department: "Credit Risk" },
  { id: 4, name: "Sneha Reddy", email: "sneha.reddy@intellicredit.com", role: "Viewer", status: "Active", lastLogin: "1 day ago", department: "Compliance" },
  { id: 5, name: "Vikram Singh", email: "vikram.singh@intellicredit.com", role: "Credit Officer", status: "Inactive", lastLogin: "2 weeks ago", department: "Corporate Banking" },
  { id: 6, name: "Anita Desai", email: "anita.desai@intellicredit.com", role: "Admin", status: "Active", lastLogin: "5 hours ago", department: "IT Operations" },
  { id: 7, name: "Rohit Mehta", email: "rohit.mehta@intellicredit.com", role: "Viewer", status: "Active", lastLogin: "3 days ago", department: "Audit" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-primary/15 text-primary border border-primary/20",
  "Credit Officer": "bg-risk-medium/15 text-risk-medium border border-risk-medium/20",
  Viewer: "bg-muted text-muted-foreground border border-border",
};

export function UserManagement() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteDept, setInviteDept] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const handleInvite = () => {
    if (!inviteName || !inviteEmail || !inviteRole) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const newUser: User = {
      id: Date.now(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole === "admin" ? "Admin" : inviteRole === "credit_officer" ? "Credit Officer" : "Viewer",
      status: "Active",
      lastLogin: "Never",
      department: inviteDept || "Unassigned",
    };
    setUsers(prev => [...prev, newUser]);
    setInviteName(""); setInviteEmail(""); setInviteRole(""); setInviteDept("");
    setDialogOpen(false);
    toast({ title: "Invitation Sent", description: `${inviteName} has been invited as ${newUser.role}.` });
  };

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
    const user = users.find(u => u.id === id);
    toast({ title: "Status Updated", description: `${user?.name} is now ${user?.status === "Active" ? "Inactive" : "Active"}.` });
  };

  const removeUser = (id: number) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: "User Removed", description: `${user?.name} has been removed from the system.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 flex-1 max-w-sm border border-border/50">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Enter full name" className="bg-muted/50 border-border/50 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@company.com" className="bg-muted/50 border-border/50 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-muted/50 border-border/50 text-foreground"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="credit_officer">Credit Officer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <Input value={inviteDept} onChange={e => setInviteDept(e.target.value)} placeholder="e.g., Credit Risk" className="bg-muted/50 border-border/50 text-foreground" />
              </div>
              <Button className="w-full bg-primary text-primary-foreground gap-2" onClick={handleInvite}><Mail className="h-4 w-4" /> Send Invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              {["User", "Role", "Department", "Status", "Last Login", ""].map(h => (
                <th key={h} className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${roleColors[u.role] || roleColors.Viewer}`}>{u.role}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{u.department}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    {u.status === "Active" ? <CheckCircle className="h-3.5 w-3.5 text-risk-low" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className={`text-xs ${u.status === "Active" ? "text-risk-low" : "text-muted-foreground"}`}>{u.status}</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{u.lastLogin}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted/50">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast({ title: "Edit User", description: `Editing ${u.name}'s profile.` })}>
                        <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(u.id)}>
                        {u.status === "Active" ? <Ban className="h-3.5 w-3.5 mr-2" /> : <UserCheck className="h-3.5 w-3.5 mr-2" />}
                        {u.status === "Active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => removeUser(u.id)} className="text-risk-high focus:text-risk-high">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
