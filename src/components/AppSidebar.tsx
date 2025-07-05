import { LayoutDashboard, Sparkles, Camera, Target } from "lucide-react"
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
    icon: LayoutDashboard 
  },
  { 
    title: "AI Analysis", 
    value: "ai", 
    icon: Sparkles 
  },
  { 
    title: "Design Recommendations", 
    value: "recommendations", 
    icon: Target 
  },
  { 
    title: "Screenshot", 
    value: "screenshot", 
    icon: Camera 
  },
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar()

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
                    onClick={() => onTabChange(item.value)}
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