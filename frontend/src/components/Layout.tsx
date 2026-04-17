import { useState, ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { cn } from "../utils/helpers"
import {
  LayoutDashboard,
  Plane,
  GitBranch,
  DoorOpen,
  Wind,
  Briefcase,
  Fuel,
  Wrench,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Map,
  BarChart2,
  Kanban
} from "lucide-react"

type NavItem = {
  to: string
  icon: any
  label: string
  end?: boolean
}

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/flights", icon: Plane, label: "Flights" },
  { to: "/flights/board", icon: Kanban, label: "Flight Board" },
  { to: "/aircraft", icon: GitBranch, label: "Aircraft" },
  { to: "/gates", icon: DoorOpen, label: "Gates" },
  { to: "/runways", icon: Wind, label: "Runways" },
  { to: "/resources", icon: Map, label: "Resources" },
  { to: "/baggage", icon: Briefcase, label: "Baggage" },
  { to: "/refuel", icon: Fuel, label: "Refueling" },
  { to: "/maintenance", icon: Wrench, label: "Maintenance" },
  { to: "/staff", icon: Users, label: "Ground Staff" },
  { to: "/reports", icon: BarChart2, label: "Reports" }
]

type SidebarProps = {
  onNav?: () => void
}

function Sidebar({ onNav }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside className="flex flex-col h-full bg-gray-950 border-r border-gray-800/60 w-64">
      <div className="px-5 py-5 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Plane className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="font-display font-bold text-white text-sm">
              AeroOps
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest">
              Ground Control v2
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            onClick={onNav}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-700/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive
                      ? "text-indigo-400"
                      : "text-gray-600 group-hover:text-gray-400"
                  )}
                />

                {label}

                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto text-indigo-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/60 border border-gray-800/40">

          <div className="w-8 h-8 bg-indigo-900/60 border border-indigo-800/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-300">
              {user?.username?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">
              {user?.username ?? "User"}
            </div>

            <div className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1">
              {isAdmin && <Shield className="w-2.5 h-2.5" />}
              {user?.role ?? "Guest"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-600 hover:text-red-400 transition-colors" />
          </button>

        </div>
      </div>
    </aside>
  )
}

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {

  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">

      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative z-10 animate-slide-in">
            <Sidebar onNav={() => setMobileOpen(false)} />
          </div>

        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-gray-950">

          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-400" />
            <span className="font-display font-bold text-white text-sm">
              AeroOps
            </span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}