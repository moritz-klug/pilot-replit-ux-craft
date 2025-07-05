import { LayoutDashboard, Sparkles, Camera, Target } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const items = [
  { 
    title: "UI Components", 
    value: "ui", 
    icon: LayoutDashboard,
    route: "/feature-review"
  },
  { 
    title: "AI Analysis", 
    value: "ai", 
    icon: Sparkles,
    route: "/feature-review"
  },
  { 
    title: "Design Recommendations", 
    value: "recommendations", 
    icon: Target,
    route: "/recommendations"
  },
  { 
    title: "Screenshot", 
    value: "screenshot", 
    icon: Camera,
    route: "/feature-review"
  },
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()

  const handleItemClick = (item: typeof items[0]) => {
    if (item.value === "recommendations") {
      // Navigate to recommendations page
      navigate('/recommendations', { 
        state: location.state 
      });
    } else {
      // Change tab within current page
      onTabChange(item.value);
    }
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analysis Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    onClick={() => handleItemClick(item)}
                    isActive={activeTab === item.value}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}