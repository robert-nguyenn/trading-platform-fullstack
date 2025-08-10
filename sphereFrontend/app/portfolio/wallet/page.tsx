"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  CreditCard,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  DollarSign,
  Building2,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import apiClient from '@/lib/apiClient'

// Types for data structures
interface LinkedAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  status: "active" | "pending" | "inactive";
  type: "Checking" | "Savings";
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  bankName: string;
  accountNumber: string;
}

export default function PortfolioWalletPage() {
  const [balance, setBalance] = useState(1200.0)
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  
  // Data states
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  
  // Load data on component mount
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [accountsResponse, transactionsResponse, balanceResponse] = await Promise.all([
          apiClient.get('/wallet/accounts'),
          apiClient.get('/wallet/transactions'),
          apiClient.get('/wallet/balance')
        ]);
        
        setLinkedAccounts(accountsResponse.data);
        setRecentTransactions(transactionsResponse.data);
        setBalance(balanceResponse.data.balance);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setLoadingAccounts(false);
        setLoadingTransactions(false);
      }
    };

    fetchWalletData();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value)
    }
  }

  // Handle fund loading
  const handleLoadFunds = () => {
    if (!amount || !selectedAccount) return

    // In a real app, this would call an API to initiate the transfer
    alert(`Loading ${formatCurrency(Number.parseFloat(amount))} from account ${selectedAccount}`)

    // Reset form
    setAmount("")
    setSelectedAccount("")
    setIsAddFundsOpen(false)
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-4 pt-6 max-w-6xl">
      {/* Page Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <UserNav />
                  </div>
      </header>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Portfolio</h1>
         
        <p className="text-muted-foreground mt-1">Manage your wallet and fund it securely</p>
        

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Card className="w-full sm:w-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(balance)}</h2>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setIsAddFundsOpen(true)} className="sm:ml-auto">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Add Funds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Bank Accounts Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Bank Accounts</CardTitle>
                <CardDescription>Manage your linked accounts for transfers</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setIsAddAccountOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </CardHeader>
            <CardContent>
              {linkedAccounts.length > 0 ? (
                <div className="space-y-4">
                  {linkedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{account.bankName}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.type} • {account.accountNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(account.status)}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Account options</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No bank accounts linked</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Add a bank account to start funding your wallet</p>
                  <Button className="mt-4" onClick={() => setIsAddAccountOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Funding Activity</CardTitle>
              <CardDescription>Recent transfers and deposits</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{transaction.bankName}</span>
                            <span className="text-xs text-muted-foreground">{transaction.accountNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {renderStatusIcon(transaction.status)}
                            <span className="text-sm">
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <Button variant="outline">View All Transactions</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Add Funds Card (Persistent on Desktop) */}
        <div className="hidden lg:block">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>Load money into your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">From Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedAccounts.filter((account) => account.status === "active").map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bankName} ({account.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
              <Button onClick={handleLoadFunds} disabled={!amount || !selectedAccount} className="w-full">
                Load Funds
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ACH transfers typically take 1-3 business days to complete
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Add Bank Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Connect your bank account securely to fund your wallet</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="rounded-lg border p-4 text-center">
                <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Connect via Plaid</h3>
                <p className="text-sm text-muted-foreground mt-1">Securely connect your bank using Plaid</p>
                <Button className="mt-4 w-full">Connect Bank</Button>
              </div>

              <Separator>
                <span className="text-xs text-muted-foreground px-2">or</span>
              </Separator>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="routing">Routing Number</Label>
                  <Input id="routing" placeholder="123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account Number</Label>
                  <Input id="account" placeholder="987654321" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Account Number</Label>
                  <Input id="confirm" placeholder="987654321" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-type">Account Type</Label>
                  <Select>
                    <SelectTrigger id="account-type">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>
              Cancel
            </Button>
            <Button>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog (Mobile Only) */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>Load money into your wallet</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile-amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-account">From Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger id="mobile-account">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedAccounts.filter((account) => account.status === "active").map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bankName} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col items-stretch gap-4">
            <Button onClick={handleLoadFunds} disabled={!amount || !selectedAccount} className="w-full">
              Load Funds
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              ACH transfers typically take 1-3 business days to complete
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

