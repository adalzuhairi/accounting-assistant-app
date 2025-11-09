import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Invoice, insertInvoiceSchema, Client } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientForm } from "@/components/clients/client-form";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSuccess?: () => void;
}

// Extend the invoice schema for the form
const invoiceFormSchema = insertInvoiceSchema.extend({
  date: z.date({
    required_error: "A date is required",
  }),
  // Accept string input for amount
  amount: z.string().transform((val) => {
    return val === "" ? "0" : val;
  }),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const isEditing = !!invoice;
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  
  // Fetch clients for search
  const {
    data: clients = [],
    isLoading: clientsLoading
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Create form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: invoice?.title || "",
      clientName: invoice?.clientName || "",
      amount: invoice?.amount ? invoice.amount : "0",
      date: invoice?.date ? new Date(invoice.date) : new Date(),
      status: invoice?.status || "pending",
      userId: invoice?.userId || 0, // This will be set by the server
      clientId: invoice?.clientId || undefined,
    },
  });
  
  // Update client name and client ID when a client is selected
  useEffect(() => {
    if (selectedClient) {
      form.setValue("clientName", selectedClient.name);
      form.setValue("clientId", selectedClient.id);
    }
  }, [selectedClient, form]);

  // Create or update invoice mutation
  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      if (isEditing && invoice) {
        const res = await apiRequest("PUT", `/api/invoices/${invoice.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/invoices", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create invoice');
        }
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      if (!isEditing) {
        toast({
          title: "Invoice created and sent",
          description: `Invoice #${data.id} has been created and sent to the client's email.`,
        });
      } else {
        toast({
          title: "Invoice updated",
          description: `Invoice #${data.id} has been updated successfully.`,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InvoiceFormValues) {
    mutation.mutate(data);
  }

  const handleClientFormSuccess = () => {
    setIsClientFormOpen(false);
    // Refetch clients after creating a new one
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
  };

  return (
    <>
      {/* Create Client Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Fill in the client's details to create a new record.
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={handleClientFormSuccess} />
        </DialogContent>
      </Dialog>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter invoice title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Client</FormLabel>
                <div className="flex space-x-2">
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientSearchOpen}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? field.value
                            : "Select a client..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandEmpty>
                          {clientsLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <p className="mb-2">No clients found</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setClientSearchOpen(false);
                                  setIsClientFormOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create new client
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => {
                                form.setValue("clientName", client.name);
                                form.setValue("clientId", client.id);
                                setSelectedClient(client);
                                setClientSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === client.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setClientSearchOpen(false);
                              setIsClientFormOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create new client
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-8"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "0" : value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Invoice" : "Create Invoice"}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}