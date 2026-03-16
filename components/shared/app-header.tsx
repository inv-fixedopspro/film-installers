"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wrench,
  Building2,
  Plus,
  ShoppingCart,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks";
import { Logo } from "@/components/shared/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PUBLIC_NAV_LINKS = [
  { href: "/blog", label: "Blog" },
];

const USER_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/network", label: "Network" },
  { href: "/forum", label: "Forum" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/blog", label: "Blog" },
];

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ad-space", label: "Ad Space" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/manage-shop", label: "Shop" },
];

interface PublicAppHeaderProps {
  variant: "public";
}

interface AuthenticatedAppHeaderProps {
  variant: "user" | "admin";
  cartItemCount?: number;
  userData?: { email: string } | null;
  activeProfileType?: string | null;
  hasInstallerProfile?: boolean;
  hasEmployerProfile?: boolean;
  canCreateInstallerProfile?: boolean;
  canCreateEmployerProfile?: boolean;
  avatarStoragePath?: string | null;
  onSignOut?: () => void;
  onSwitchProfile?: (type: "installer" | "employer") => void;
}

type AppHeaderProps = PublicAppHeaderProps | AuthenticatedAppHeaderProps;

export function AppHeader(props: AppHeaderProps) {
  if (props.variant === "public") {
    return <PublicHeader />;
  }
  return <AuthenticatedHeader {...props} />;
}

function PublicHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLinkActive = (href: string) => pathname === href;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "bg-primary backdrop-blur-md shadow-lg shadow-black/10" : "bg-primary"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo
          href="/"
          size="md"
          textClassName="text-base tracking-tight text-primary-foreground/80"
        />

        <div className="hidden md:flex items-center gap-3">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors group",
                isLinkActive(link.href)
                  ? "text-primary-foreground"
                  : "text-primary-foreground/50 hover:text-primary-foreground/80"
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-brand/60 transition-all duration-300",
                  isLinkActive(link.href) ? "w-2/3" : "w-0 group-hover:w-2/3"
                )}
              />
            </Link>
          ))}

          <span className="text-primary-foreground/20 text-lg font-thin select-none">|</span>

          <Link href="/shop">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-muted/20"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-primary-foreground/50 hover:text-foreground hover:bg-muted/20"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/join">
            <Button
              size="sm"
              className="text-sm px-5 bg-brand/40 hover:bg-brand/60 text-brand-foreground/80 hover:text-brand-foreground font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-brand/20"
            >
              Join Free
            </Button>
          </Link>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-muted/20"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-card border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">
                <Logo size="md" textClassName="text-base font-semibold tracking-tight text-foreground" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Shop
              </Link>
            </nav>
            <div className="flex flex-col gap-3 mt-8 pt-8 border-t border-border">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full text-sm border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/join" onClick={() => setIsOpen(false)}>
                <Button className="w-full text-sm bg-gradient-brand hover:bg-gradient-brand-hover text-brand-foreground font-semibold">
                  Join Free
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function AuthenticatedHeader({
  variant,
  cartItemCount = 0,
  userData,
  activeProfileType,
  hasInstallerProfile = false,
  hasEmployerProfile = false,
  canCreateInstallerProfile = false,
  canCreateEmployerProfile = false,
  avatarStoragePath,
  onSignOut,
  onSwitchProfile,
}: AuthenticatedAppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    onSignOut?.();
  };

  const handleSwitchProfile = (type: "installer" | "employer") => {
    onSwitchProfile?.(type);
  };

  const baseLinks = variant === "admin" ? ADMIN_NAV_LINKS : USER_NAV_LINKS;
  const navLinks =
    variant === "user" && activeProfileType === "installer"
      ? [...baseLinks, { href: "/dashboard/resume", label: "Resume" }]
      : baseLinks;

  const isLinkActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href;
  };

  const headerStyles =
    isScrolled
      ? "bg-primary backdrop-blur-md shadow-lg shadow-black/10"
      : "bg-primary";

  const textColor = "text-primary-foreground/50 hover:text-primary-foreground/80";

  const activeTextColor = "text-primary-foreground";

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", headerStyles)}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo
          href={variant === "admin" ? "/admin" : "/dashboard"}
          size="md"
          textClassName="text-base tracking-tight text-primary-foreground/80"
        />

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors group",
                isLinkActive(link.href) ? activeTextColor : textColor
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-brand/60 transition-all duration-300",
                  isLinkActive(link.href) ? "w-2/3" : "w-0 group-hover:w-2/3"
                )}
              />
            </Link>
          ))}

          <span className="text-primary-foreground/20 text-lg font-thin select-none mx-1">|</span>

          {variant === "user" && (
            <>
              <ProfileSwitcher
                activeProfileType={activeProfileType}
                hasInstallerProfile={hasInstallerProfile}
                hasEmployerProfile={hasEmployerProfile}
                canCreateInstallerProfile={canCreateInstallerProfile}
                canCreateEmployerProfile={canCreateEmployerProfile}
                onSwitch={handleSwitchProfile}
                onCreateProfile={(type) => router.push(`/dashboard/create-profile/${type}`)}
              />

              <Link href="/shop/cart" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-muted/20"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand text-brand-foreground text-xs font-medium flex items-center justify-center">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              <UserAvatarMenu
                email={userData?.email}
                avatarStoragePath={avatarStoragePath}
                onSettings={() => router.push("/dashboard/settings")}
                onMyOrders={() => router.push("/dashboard/orders")}
                onSignOut={handleSignOut}
              />
            </>
          )}

          {variant === "admin" && (
            <AdminAvatarMenu
              email={userData?.email}
              avatarStoragePath={avatarStoragePath}
              hasProfiles={hasInstallerProfile || hasEmployerProfile}
              onSettings={() => router.push("/admin/settings")}
              onBackToDashboard={() => router.push("/dashboard")}
              onSignOut={handleSignOut}
            />
          )}
        </div>

        <MobileMenu
          variant={variant}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          navLinks={navLinks}
          cartItemCount={cartItemCount}
          userData={userData}
          activeProfileType={activeProfileType}
          hasInstallerProfile={hasInstallerProfile}
          hasEmployerProfile={hasEmployerProfile}
          canCreateInstallerProfile={canCreateInstallerProfile}
          canCreateEmployerProfile={canCreateEmployerProfile}
          avatarStoragePath={avatarStoragePath}
          onSwitch={handleSwitchProfile}
          onCreateProfile={(type) => {
            setIsOpen(false);
            router.push(`/dashboard/create-profile/${type}`);
          }}
          onSettings={() => {
            setIsOpen(false);
            router.push(variant === "admin" ? "/admin/settings" : "/dashboard/settings");
          }}
          onMyOrders={() => {
            setIsOpen(false);
            router.push("/dashboard/orders");
          }}
          onBackToDashboard={() => {
            setIsOpen(false);
            router.push("/dashboard");
          }}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}

interface ProfileSwitcherProps {
  activeProfileType?: string | null;
  hasInstallerProfile: boolean;
  hasEmployerProfile: boolean;
  canCreateInstallerProfile: boolean;
  canCreateEmployerProfile: boolean;
  onSwitch: (type: "installer" | "employer") => void;
  onCreateProfile: (type: "installer" | "employer") => void;
}

function ProfileSwitcher({
  activeProfileType,
  hasInstallerProfile,
  hasEmployerProfile,
  canCreateInstallerProfile,
  canCreateEmployerProfile,
  onSwitch,
  onCreateProfile,
}: ProfileSwitcherProps) {
  if (!hasInstallerProfile && !hasEmployerProfile) return null;

  const getActiveLabel = () => {
    if (activeProfileType === "installer") {
      return (
        <>
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Installer View</span>
        </>
      );
    }
    return (
      <>
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">Employer View</span>
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-muted/20"
        >
          {getActiveLabel()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasInstallerProfile && (
          <DropdownMenuItem
            onClick={() => onSwitch("installer")}
            className={cn(activeProfileType === "installer" && "bg-highlight")}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Installer Dashboard
            {activeProfileType === "installer" && (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        )}

        {hasEmployerProfile && (
          <DropdownMenuItem
            onClick={() => onSwitch("employer")}
            className={cn(activeProfileType === "employer" && "bg-highlight")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Employer Dashboard
            {activeProfileType === "employer" && (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        )}

        {(canCreateInstallerProfile || canCreateEmployerProfile) && (
          <>
            <DropdownMenuSeparator />
            {canCreateInstallerProfile && (
              <DropdownMenuItem onClick={() => onCreateProfile("installer")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Installer Profile
              </DropdownMenuItem>
            )}
            {canCreateEmployerProfile && (
              <DropdownMenuItem onClick={() => onCreateProfile("employer")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Employer Profile
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserAvatarMenuProps {
  email?: string;
  avatarStoragePath?: string | null;
  onSettings: () => void;
  onMyOrders: () => void;
  onSignOut: () => void;
}

function UserAvatarMenu({ email, avatarStoragePath, onSettings, onMyOrders, onSignOut }: UserAvatarMenuProps) {
  const avatarUrl = useAvatarUrl(avatarStoragePath);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-muted/20"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
            <AvatarFallback className="bg-muted/20">
              <User className="h-4 w-4 text-primary-foreground/70" />
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email && (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onMyOrders}>
          <Package className="h-4 w-4 mr-2" />
          My Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminAvatarMenuProps {
  email?: string;
  avatarStoragePath?: string | null;
  hasProfiles: boolean;
  onSettings: () => void;
  onBackToDashboard: () => void;
  onSignOut: () => void;
}

function AdminAvatarMenu({
  email,
  avatarStoragePath,
  hasProfiles,
  onSettings,
  onBackToDashboard,
  onSignOut,
}: AdminAvatarMenuProps) {
  const avatarUrl = useAvatarUrl(avatarStoragePath);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-muted/20">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
            <AvatarFallback className="bg-muted/20">
              <User className="h-4 w-4 text-primary-foreground/70" />
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {email && (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        {hasProfiles && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBackToDashboard}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MobileMenuProps {
  variant: "user" | "admin";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  navLinks: { href: string; label: string }[];
  cartItemCount: number;
  userData?: { email: string } | null;
  activeProfileType?: string | null;
  hasInstallerProfile: boolean;
  hasEmployerProfile: boolean;
  canCreateInstallerProfile: boolean;
  canCreateEmployerProfile: boolean;
  avatarStoragePath?: string | null;
  onSwitch: (type: "installer" | "employer") => void;
  onCreateProfile: (type: "installer" | "employer") => void;
  onSettings: () => void;
  onMyOrders: () => void;
  onBackToDashboard: () => void;
  onSignOut: () => void;
}

function MobileMenu({
  variant,
  isOpen,
  onOpenChange,
  navLinks,
  cartItemCount,
  userData,
  activeProfileType,
  hasInstallerProfile,
  hasEmployerProfile,
  canCreateInstallerProfile,
  canCreateEmployerProfile,
  avatarStoragePath,
  onSwitch,
  onCreateProfile,
  onSettings,
  onMyOrders,
  onBackToDashboard,
  onSignOut,
}: MobileMenuProps) {
  const avatarUrl = useAvatarUrl(avatarStoragePath);
  const buttonStyles = "text-primary-foreground/50 hover:text-primary-foreground hover:bg-muted/20";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" className={buttonStyles}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            <Logo size="md" textClassName="text-base font-semibold tracking-tight text-foreground" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 mt-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}

          {variant === "user" && (
            <Link
              href="/shop/cart"
              onClick={() => onOpenChange(false)}
              className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shop
              </span>
              {cartItemCount > 0 && (
                <span className="h-5 px-2 rounded-full bg-brand text-brand-foreground text-xs font-medium flex items-center justify-center">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {variant === "user" && (hasInstallerProfile || hasEmployerProfile) && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Switch Profile
            </p>
            <div className="flex flex-col gap-1">
              {hasInstallerProfile && (
                <button
                  onClick={() => {
                    onSwitch("installer");
                    onOpenChange(false);
                  }}
                  className={cn(
                    "px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2",
                    activeProfileType === "installer"
                      ? "bg-highlight text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Wrench className="h-5 w-5" />
                  Installer
                  {activeProfileType === "installer" && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </button>
              )}
              {hasEmployerProfile && (
                <button
                  onClick={() => {
                    onSwitch("employer");
                    onOpenChange(false);
                  }}
                  className={cn(
                    "px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2",
                    activeProfileType === "employer"
                      ? "bg-highlight text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Building2 className="h-5 w-5" />
                  Employer
                  {activeProfileType === "employer" && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </button>
              )}
              {canCreateInstallerProfile && (
                <button
                  onClick={() => onCreateProfile("installer")}
                  className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create Installer Profile
                </button>
              )}
              {canCreateEmployerProfile && (
                <button
                  onClick={() => onCreateProfile("employer")}
                  className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create Employer Profile
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 mt-6 pt-6 border-t border-border">
          {userData && (
            <div className="px-4 py-2 flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
                <AvatarFallback className="bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
            </div>
          )}

          {variant === "user" && (
            <button
              onClick={onMyOrders}
              className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
            >
              <Package className="h-5 w-5" />
              My Orders
            </button>
          )}

          <button
            onClick={onSettings}
            className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>

          {variant === "admin" && (hasInstallerProfile || hasEmployerProfile) && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-3 text-base text-muted-foreground font-medium rounded-lg transition-all hover:text-foreground hover:bg-accent flex items-center gap-2"
            >
              <LayoutDashboard className="h-5 w-5" />
              Back to Dashboard
            </button>
          )}

          <button
            onClick={() => {
              onOpenChange(false);
              onSignOut();
            }}
            className="px-4 py-3 text-base text-destructive font-medium rounded-lg transition-all hover:bg-destructive/10 flex items-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
