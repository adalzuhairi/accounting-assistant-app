import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Lock, UserCog } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for account details
const accountDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
});

// Form schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmNewPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type AccountDetailsFormValues = z.infer<typeof accountDetailsSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account details form
  const accountForm = useForm<AccountDetailsFormValues>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onAccountSubmit = async (data: AccountDetailsFormValues) => {
    try {
      setIsUpdatingAccount(true);
      // In a real application, this would make an API call to update the user's details
      // await apiRequest("PATCH", "/api/user", data);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Account updated",
        description: "Your account details have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your account",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setIsChangingPassword(true);
      // In a real application, this would make an API call to change the password
      // await apiRequest("POST", "/api/user/change-password", data);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "An error occurred while changing your password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-200">
        <div className="px-6 py-8 pt-24 md:pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">User Profile</h2>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="account" className="flex items-center">
                      <User className="h-4 w-4 mr-2" /> Account
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                      <Lock className="h-4 w-4 mr-2" /> Security
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="account" className="mt-0">
                    <div className="space-y-8">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="bg-primary h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium">{user.role}</span>
                        </div>
                        
                        <div className="flex-1">
                          <Form {...accountForm}>
                            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6">
                              <FormField
                                control={accountForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={accountForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button 
                                type="submit" 
                                disabled={isUpdatingAccount}
                                className="mt-6"
                              >
                                {isUpdatingAccount ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </form>
                          </Form>
                        </div>
                      </div>
                      
                      <div>
                        <CardTitle className="text-xl mb-4">Account Information</CardTitle>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-gray-500">User ID</Label>
                              <div className="font-medium">#{user.id}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-gray-500">Role</Label>
                              <div className="font-medium capitalize">{user.role}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <CardTitle className="text-xl mb-2">Change Password</CardTitle>
                        <CardDescription>
                          Ensure your account is using a secure password to protect your data.
                        </CardDescription>
                        
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 mt-6">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="confirmNewPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button 
                              type="submit" 
                              disabled={isChangingPassword}
                              className="mt-6"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Changing Password...
                                </>
                              ) : (
                                <>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Change Password
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
