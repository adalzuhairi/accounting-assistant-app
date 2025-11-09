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
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Payment, insertPaymentSchema, Invoice } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PaymentFormProps {
  payment?: Payment | null;
  onSuccess?: () => void;
}

// Extend the payment schema for the form
const paymentFormSchema = insertPaymentSchema.extend({
  date: z.date({
    required_error: "A date is required",
  }),
  // Accept string input for amount
  amount: z.string().transform((val) => {
    return val === "" ? "0" : val;
  }),
  // Ensure receiptGenerated is a boolean
  receiptGenerated: z.boolean().optional().default(false),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function PaymentForm({ payment, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const isEditing = !!payment;
  
  // Fetch invoices for the select dropdown
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Create form with default values
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId: payment?.invoiceId || 0,
      amount: payment?.amount || "0",
      date: payment?.date ? new Date(payment.date) : new Date(),
      receiptGenerated: payment?.receiptGenerated ?? false,
      userId: payment?.userId || 0, // This will be set by the server
    },
  });

  // Create or update payment mutation
  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      if (isEditing && payment) {
        const res = await apiRequest("PUT", `/api/payments/${payment.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/payments", data);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: isEditing ? "Payment updated" : "Payment recorded",
        description: isEditing
          ? `Payment #${data.id} has been updated successfully.`
          : `Payment #${data.id} has been recorded successfully.`,
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "record"} payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Set invoice details when an invoice is selected
  const selectedInvoiceId = form.watch("invoiceId");
  const selectedInvoice = invoices?.find(inv => inv.id === selectedInvoiceId);
  
  // When selecting an invoice, pre-fill the amount field with the invoice amount
  useEffect(() => {
    if (selectedInvoice && !isEditing) {
      form.setValue("amount", selectedInvoice.amount);
    }
  }, [selectedInvoiceId, selectedInvoice, form, isEditing]);

  function onSubmit(data: PaymentFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : undefined}
                disabled={isLoadingInvoices}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingInvoices ? (
                    <SelectItem value="loading" disabled>
                      Loading invoices...
                    </SelectItem>
                  ) : invoices?.length ? (
                    invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id.toString()}>
                        #{invoice.id} - {invoice.clientName} (${Number(invoice.amount).toFixed(2)})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No invoices found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedInvoice && (
          <div className="bg-blue-50 p-3 rounded-md text-sm">
            <p><strong>Invoice:</strong> {selectedInvoice.title}</p>
            <p><strong>Client:</strong> {selectedInvoice.clientName}</p>
            <p><strong>Total Amount:</strong> ${Number(selectedInvoice.amount).toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
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
              <FormLabel>Payment Date</FormLabel>
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

        {isEditing && (
          <FormField
            control={form.control}
            name="receiptGenerated"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Receipt Generated</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Mark if a receipt has been generated for this payment
                  </p>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Recording..."}
              </>
            ) : (
              <>{isEditing ? "Update Payment" : "Record Payment"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
