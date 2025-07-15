import { LayoutDashboard, MessageSquare, Webhook } from "lucide-react"
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
  activeChatbots?: Record<string, boolean>
  onChatSelect?: (featureName: string) => void
}

const items = [
  { 
    title: "UI Components", 
    value: "ui", 
    icon: LayoutDashboard,
    route: "/feature-review"
  },
  { 
    title: "Webhook Input", 
    value: "webhook", 
    icon: Webhook,
    route: "/feature-review"
  },
]

export function AppSidebar({ activeTab, onTabChange, activeChatbots = {}, onChatSelect }: AppSidebarProps) {
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

        {/* Active Chats */}
        {Object.keys(activeChatbots).some(key => activeChatbots[key]) && (
          <SidebarGroup>
            <SidebarGroupLabel>Active Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Object.entries(activeChatbots)
                  .filter(([_, isActive]) => isActive)
                  .map(([featureName]) => (
                  <SidebarMenuItem key={featureName}>
                    <SidebarMenuButton 
                      onClick={() => onChatSelect?.(featureName)}
                      className="w-full justify-start"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span className="truncate">{featureName}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}