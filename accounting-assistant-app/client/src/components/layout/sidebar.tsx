import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CalculatorButton } from "@/components/ui/CalculatorButton";
import { useCalculator } from "@/contexts/CalculatorContext";
import {
  LayoutDashboard,
  File,
  CreditCard,
  BarChart2,
  User,
  LogOut,
  Menu,
  X,
  Calculator,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { openCalculator } = useCalculator();

  // Close sidebar when location changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  // Automatically open sidebar on desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Base navigation links for all users
  const baseNavLinks = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/clients",
      label: "Clients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/invoices",
      label: "Invoices",
      icon: <File className="h-5 w-5" />,
    },
    {
      href: "/payments",
      label: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ];
  
  // Admin-only links
  const adminLinks = [
    {
      href: "/users",
      label: "Users Management",
      icon: <User className="h-5 w-5" />,
    },
  ];
  
  // Combine links based on user role
  const navLinks = user?.role === "admin" 
    ? [...baseNavLinks, ...adminLinks] 
    : baseNavLinks;

  // Mobile menu toggle button
  const mobileMenuButton = (
    <Button
      variant="default"
      size="icon"
      className="fixed z-50 bottom-4 right-4 md:hidden rounded-full shadow-lg"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );

  if (!user) {
    return null;
  }

  return (
    <>
      {mobileMenuButton}
      <aside 
        className={cn(
          "bg-gray-800 text-white w-64 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out z-30 overflow-y-auto",
          {
            "translate-x-0": sidebarOpen,
            "-translate-x-full": !sidebarOpen && isMobile,
          }
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Calculator className="text-primary text-xl mr-2" />
            <h2 className="text-lg font-semibold">AAC</h2>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="px-4 py-2">
          <div className="flex items-center p-2 mb-4 bg-gray-700 rounded-lg">
            <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
          
          <nav>
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link href={link.href}>
                  <div
                    className={cn(
                      "flex items-center p-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg mb-1 group transition duration-150 cursor-pointer",
                      { "bg-gray-700 text-white": location === link.href }
                    )}
                  >
                    <span className="w-5 text-center">{link.icon}</span>
                    <span className="ml-3">{link.label}</span>
                  </div>
                </Link>
              </div>
            ))}
            
            {/* Calculator Button */}
            <div className="mt-4">
              <CalculatorButton
                onClick={openCalculator}
                className="w-full justify-start bg-gray-700 text-white hover:bg-gray-600"
              />
            </div>
          </nav>
        </div>
        
        <div className="p-4 mt-6 border-t border-gray-700">
          <Button
            variant="ghost"
            className="flex items-center p-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg group transition duration-150 w-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-5 text-center" />
            <span className="ml-3">
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
}
