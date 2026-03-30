import { Link, useLocation } from "react-router-dom";
import { Home, Menu, X, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpSystem } from "@/components/Help";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppHeader() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="font-semibold">BladeTech</span>
          </Button>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-1">
              {/* Utilities Dropdown */}
              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        (["/operators", "/calibration", "/inventory", "/boxes", "/reports", "/weekly-breakdown", "/production-charts", "/clockfy-integration", "/webhook-tester", "/customer-management", "/customer", "/settings"].includes(location.pathname)) && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Utilities
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/operators" className="w-full">
                        Operators
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/calibration" className="w-full">
                        Calibration
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/inventory" className="w-full">
                        Inventory
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/boxes" className="w-full">
                        Boxes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/customer-management" className="w-full">
                        Customer Label Templates
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/customer" className="w-full">
                        Supplier QC
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/weekly-breakdown" className="w-full">
                        Weekly Breakdown
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/production-charts" className="w-full">
                        Production Charts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/reports" className="w-full">
                        Reports Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/clockfy-integration" className="w-full">
                        Clockfy Integration
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/webhook-tester" className="w-full">
                        Webhook Tester
                      </Link>
                    </DropdownMenuItem>
                    {/* Conditionally show warehouse link */}
                    {(() => {
                      try {
                        const { isWarehouseEnabled } = require('@/features/warehouse');
                        return isWarehouseEnabled() ? (
                          <DropdownMenuItem asChild>
                            <Link to="/warehouse" className="w-full">
                              Warehouse
                            </Link>
                          </DropdownMenuItem>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                    <DropdownMenuItem asChild>
                      <Link to="/backups" className="w-full">
                        Backups
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Help Button */}
        <div className="hidden md:flex">
          <HelpSystem />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden flex-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="flex flex-col space-y-1 p-4">
            {/* Mobile Help */}
            <div className="mb-2">
              <HelpSystem />
            </div>
            {/* Utilities Section */}
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Utilities
            </div>
            <Link
              to="/operators"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/operators" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Operators
            </Link>
            <Link
              to="/calibration"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/calibration" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Calibration
            </Link>
            <Link
              to="/inventory"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/inventory" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inventory
            </Link>
            <Link
              to="/boxes"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/boxes" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Boxes
            </Link>
            <Link
              to="/customer-management"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/customer-management" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Customer Label Templates
            </Link>
            <Link
              to="/customer"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/customer" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Supplier QC
            </Link>
            <Link
              to="/weekly-breakdown"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/weekly-breakdown" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Weekly Breakdown
            </Link>
            <Link
              to="/production-charts"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/production-charts" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Production Charts
            </Link>
            <Link
              to="/reports"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/reports" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reports Dashboard
            </Link>
            <Link
              to="/clockfy-integration"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/clockfy-integration" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Clockfy Integration
            </Link>
            <Link
              to="/webhook-tester"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/webhook-tester" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Webhook Tester
            </Link>
            <Link
              to="/backups"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/backups" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Backups
            </Link>
            <Link
              to="/settings"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/settings" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
