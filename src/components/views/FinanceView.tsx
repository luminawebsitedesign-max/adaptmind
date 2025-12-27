import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Trophy,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Portfolio, Transaction, FinanceGoal } from "@/types";
import { toast } from "sonner";

export function FinanceView() {
  const { 
    portfolios, 
    transactions, 
    financeGoals,
    addPortfolio, 
    deletePortfolio,
    addTransaction,
    addFinanceGoal,
    updateFinanceGoal,
    setCurrentView,
  } = useAppStore();

  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: "",
    icon: "💰",
    type: "personal" as Portfolio["type"],
    balance: 0,
    currency: "USD",
  });
  const [newTransaction, setNewTransaction] = useState({
    portfolioId: "",
    type: "income" as Transaction["type"],
    amount: 0,
    description: "",
    category: "General",
  });
  const [newGoal, setNewGoal] = useState({
    portfolioId: "",
    title: "",
    targetAmount: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; portfolioId: string; portfolioName: string }>({
    open: false,
    portfolioId: "",
    portfolioName: "",
  });
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ type: string; amount: number; description: string; date: string }>>([]);
  const [selectedPortfolioForCSV, setSelectedPortfolioForCSV] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvPreview([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError("CSV file must have a header row and at least one data row");
          return;
        }

        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const typeIndex = header.findIndex(h => h.includes('type'));
        const amountIndex = header.findIndex(h => h.includes('amount'));
        const descIndex = header.findIndex(h => h.includes('description') || h.includes('desc'));
        const dateIndex = header.findIndex(h => h.includes('date'));

        if (amountIndex === -1) {
          setCsvError("CSV must have an 'amount' column. Expected columns: type, amount, description, date");
          return;
        }

        const parsed: Array<{ type: string; amount: number; description: string; date: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          const amount = parseFloat(values[amountIndex] || '0');
          if (isNaN(amount) || amount === 0) continue;

          const type = (typeIndex >= 0 ? values[typeIndex]?.toLowerCase() : 'income') || 'income';
          const validType = ['income', 'expense', 'transfer'].includes(type) ? type : (amount >= 0 ? 'income' : 'expense');
          
          parsed.push({
            type: validType,
            amount: Math.abs(amount),
            description: descIndex >= 0 ? values[descIndex] || `Transaction ${i}` : `Transaction ${i}`,
            date: dateIndex >= 0 ? values[dateIndex] || new Date().toISOString() : new Date().toISOString(),
          });
        }

        if (parsed.length === 0) {
          setCsvError("No valid transactions found in CSV");
          return;
        }

        setCsvPreview(parsed);
      } catch (err) {
        setCsvError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = () => {
    if (!selectedPortfolioForCSV || csvPreview.length === 0) return;

    csvPreview.forEach(tx => {
      addTransaction({
        portfolioId: selectedPortfolioForCSV,
        type: tx.type as Transaction["type"],
        amount: tx.amount,
        description: tx.description,
        category: "Imported",
        date: new Date(tx.date),
      });
    });

    toast.success(`Imported ${csvPreview.length} transactions!`);
    setIsCSVDialogOpen(false);
    setCsvPreview([]);
    setCsvError(null);
    setSelectedPortfolioForCSV("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const template = "type,amount,description,date\nincome,1000,Salary,2024-01-15\nexpense,50,Groceries,2024-01-16\nexpense,25,Gas,2024-01-17";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddPortfolio = () => {
    if (newPortfolio.name.trim()) {
      addPortfolio({
        name: newPortfolio.name,
        icon: newPortfolio.icon,
        type: newPortfolio.type,
        balance: newPortfolio.balance,
        currency: newPortfolio.currency,
      });
      setNewPortfolio({ name: "", icon: "💰", type: "personal", balance: 0, currency: "USD" });
      setIsAddingPortfolio(false);
      toast.success("Portfolio created!", { duration: 3000 });
    }
  };

  const handleAddTransaction = () => {
    if (newTransaction.description.trim() && newTransaction.amount > 0 && newTransaction.portfolioId) {
      addTransaction({
        portfolioId: newTransaction.portfolioId,
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: newTransaction.description,
        category: newTransaction.category,
        date: new Date(),
      });
      setNewTransaction({ portfolioId: "", type: "income", amount: 0, description: "", category: "General" });
      setIsAddingTransaction(false);
      toast.success("Transaction recorded!", { duration: 3000 });
    }
  };

  const handleAddGoal = () => {
    if (newGoal.title.trim() && newGoal.targetAmount > 0 && newGoal.portfolioId) {
      addFinanceGoal({
        portfolioId: newGoal.portfolioId,
        title: newGoal.title,
        targetAmount: newGoal.targetAmount,
        currentAmount: 0,
      });
      setNewGoal({ portfolioId: "", title: "", targetAmount: 0 });
      setIsAddingGoal(false);
      toast.success("Financial goal set!", { duration: 3000 });
    }
  };

  const handleDeletePortfolio = () => {
    deletePortfolio(deleteConfirm.portfolioId);
    setDeleteConfirm({ open: false, portfolioId: "", portfolioName: "" });
    toast.success("Portfolio deleted", { duration: 3000 });
  };

  // Calculate totals
  const totalBalance = portfolios.reduce((acc, p) => acc + p.balance, 0);
  const thisMonthTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });
  const monthlyIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  // Gamification: Calculate level based on total balance and goals achieved
  const goalsAchieved = financeGoals.filter(g => g.currentAmount >= g.targetAmount).length;
  const level = Math.floor(totalBalance / 1000) + goalsAchieved + 1;
  const progressToNextLevel = ((totalBalance % 1000) / 1000) * 100;

  // Calculate tracking streak (days with at least one transaction)
  const uniqueDays = new Set(transactions.map(t => new Date(t.date).toISOString().split('T')[0]));
  const trackingStreak = uniqueDays.size;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const portfolioIcons: Record<Portfolio["type"], React.ReactNode> = {
    personal: <Wallet className="w-5 h-5" />,
    investment: <TrendingUp className="w-5 h-5" />,
    savings: <PiggyBank className="w-5 h-5" />,
    custom: <Sparkles className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-brand">
            Finance Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your money, achieve your financial goals
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* CSV Import Button */}
          <Dialog open={isCSVDialogOpen} onOpenChange={setIsCSVDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={portfolios.length === 0}>
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Import Transactions from CSV
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your transactions. Required column: amount. Optional: type, description, date.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>

                <Select value={selectedPortfolioForCSV} onValueChange={setSelectedPortfolioForCSV}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select portfolio for import" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span>{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                  </label>
                </div>

                {csvError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{csvError}</AlertDescription>
                  </Alert>
                )}

                {csvPreview.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">
                      ✓ Found {csvPreview.length} transactions to import
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-sm bg-muted/20 rounded-lg p-2">
                      {csvPreview.slice(0, 5).map((tx, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{tx.description}</span>
                          <span className={tx.type === 'income' ? 'text-primary' : 'text-destructive'}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount}
                          </span>
                        </div>
                      ))}
                      {csvPreview.length > 5 && (
                        <p className="text-muted-foreground text-xs">...and {csvPreview.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleImportCSV} 
                  className="w-full"
                  disabled={!selectedPortfolioForCSV || csvPreview.length === 0}
                >
                  Import {csvPreview.length} Transactions
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={portfolios.length === 0}>
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
                <DialogDescription>Log your income or expense</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={newTransaction.portfolioId} onValueChange={(v) => setNewTransaction(prev => ({ ...prev, portfolioId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span>{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTransaction.type} onValueChange={(v) => setNewTransaction(prev => ({ ...prev, type: v as Transaction["type"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Income</SelectItem>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                    <SelectItem value="transfer">↔️ Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount || ""}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
                <Input
                  placeholder="Description (e.g., Salary, Groceries)"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button 
                  onClick={handleAddTransaction} 
                  className="w-full"
                  disabled={!newTransaction.description.trim() || newTransaction.amount <= 0 || !newTransaction.portfolioId}
                >
                  Record Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingPortfolio} onOpenChange={setIsAddingPortfolio}>
            <DialogTrigger asChild>
              <Button className="gap-2 glow-primary bg-secondary hover:bg-secondary/90">
                <Plus className="w-4 h-4" />
                New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>Create Portfolio</DialogTitle>
                <DialogDescription>Add a new portfolio to track your finances</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="💰"
                    value={newPortfolio.icon}
                    onChange={(e) => setNewPortfolio(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-16 text-center text-xl"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Portfolio name"
                    value={newPortfolio.name}
                    onChange={(e) => setNewPortfolio(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <Select value={newPortfolio.type} onValueChange={(v) => setNewPortfolio(prev => ({ ...prev, type: v as Portfolio["type"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">💳 Personal</SelectItem>
                    <SelectItem value="investment">📈 Investment</SelectItem>
                    <SelectItem value="savings">🐷 Savings</SelectItem>
                    <SelectItem value="custom">✨ Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Starting balance"
                  value={newPortfolio.balance || ""}
                  onChange={(e) => setNewPortfolio(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                />
                <Button onClick={handleAddPortfolio} className="w-full" disabled={!newPortfolio.name.trim()}>
                  Create Portfolio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gamification Banner - Fixed layout to prevent overlap */}
      <div className="glass rounded-2xl p-6 border border-secondary/30">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ProgressRing progress={progressToNextLevel} size={80} color="cyan" showLabel={false} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-display font-bold">Lv.{level}</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                Financial Level {level}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {progressToNextLevel.toFixed(0)}% to next level
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 md:ml-auto">
            <div className="flex items-center gap-1.5 text-sm bg-muted/20 px-3 py-1.5 rounded-lg">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{trackingStreak} day streak</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-muted/20 px-3 py-1.5 rounded-lg">
              <Target className="w-4 h-4 text-primary" />
              <span>{goalsAchieved} goals achieved</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setCurrentView("assistant")} className="gap-2 shrink-0">
            <Sparkles className="w-4 h-4" />
            Ask AI to Analyze
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Total Balance</span>
          </div>
          <p className="text-3xl font-display font-bold">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-sm font-medium">This Month Income</span>
          </div>
          <p className="text-3xl font-display font-bold text-primary">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <ArrowDownRight className="w-5 h-5" />
            <span className="text-sm font-medium">This Month Expenses</span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">{formatCurrency(monthlyExpenses)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Net This Month</span>
          </div>
          <p className={cn(
            "text-3xl font-display font-bold",
            monthlyIncome - monthlyExpenses >= 0 ? "text-primary" : "text-destructive"
          )}>
            {formatCurrency(monthlyIncome - monthlyExpenses)}
          </p>
        </div>
      </div>

      {/* Portfolios Grid */}
      {portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => {
            const portfolioGoals = financeGoals.filter(g => g.portfolioId === portfolio.id);
            const portfolioTransactions = transactions.filter(t => t.portfolioId === portfolio.id).slice(0, 3);
            
            return (
              <div key={portfolio.id} className="glass rounded-2xl p-5 hover-glow transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-2xl">
                      {portfolio.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{portfolio.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{portfolio.type}</p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ open: true, portfolioId: portfolio.id, portfolioName: portfolio.name })}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete portfolio</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <p className="text-3xl font-display font-bold mb-4">{formatCurrency(portfolio.balance)}</p>
                
                {/* Recent Transactions */}
                {portfolioTransactions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Recent</p>
                    {portfolioTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{tx.description}</span>
                        <span className={cn(
                          "font-medium",
                          tx.type === 'income' ? "text-primary" : "text-destructive"
                        )}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Portfolio Goals */}
                {portfolioGoals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Goals</p>
                    {portfolioGoals.map(goal => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div key={goal.id} className="p-2 rounded-lg bg-muted/20">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{goal.title}</span>
                            <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No portfolios yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first portfolio to start tracking your finances
          </p>
          <Button onClick={() => setIsAddingPortfolio(true)} className="gap-2 glow-primary bg-secondary hover:bg-secondary/90">
            <Plus className="w-4 h-4" />
            Create Your First Portfolio
          </Button>
        </div>
      )}

      {/* Add Financial Goal */}
      {portfolios.length > 0 && (
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Target className="w-4 h-4" />
              Set Financial Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Set a Financial Goal</DialogTitle>
              <DialogDescription>Define a savings or investment target</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={newGoal.portfolioId} onValueChange={(v) => setNewGoal(prev => ({ ...prev, portfolioId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Goal title (e.g., Emergency Fund)"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Target amount"
                value={newGoal.targetAmount || ""}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
              />
              <Button 
                onClick={handleAddGoal} 
                className="w-full"
                disabled={!newGoal.title.trim() || newGoal.targetAmount <= 0 || !newGoal.portfolioId}
              >
                Set Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Delete Portfolio?"
        description={`Are you sure you want to delete "${deleteConfirm.portfolioName}"? All transactions and goals in this portfolio will be lost.`}
        confirmLabel="Delete Portfolio"
        onConfirm={handleDeletePortfolio}
      />
    </div>
  );
}
