import { roleLabels, type UserRole } from "@/lib/auth";
import type { OrderStatus } from "@/lib/mock-data";

export const navigationItems = [
  { label: "工作台", href: "/", roles: ["owner", "sales", "photographer"] as UserRole[] },
  { label: "订单管理", href: "/orders", roles: ["owner", "sales", "photographer"] as UserRole[] },
  { label: "人员管理", href: "/staff", roles: ["owner"] as UserRole[] },
  { label: "账务流水", href: "/finance", roles: ["owner", "sales"] as UserRole[] },
  { label: "登记流水", href: "/finance/new", roles: ["owner"] as UserRole[] },
  { label: "拍摄排期", href: "/schedule", roles: ["owner", "sales", "photographer"] as UserRole[] },
  { label: "提醒中心", href: "/alerts", roles: ["owner", "sales", "photographer"] as UserRole[] },
  { label: "交付中心", href: "/delivery", roles: ["owner", "sales"] as UserRole[] },
];

export function getNavigationForRole(role: UserRole) {
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function getRoleSummary(role: UserRole) {
  const descriptions: Record<UserRole, string> = {
    owner: "查看经营看板、全部财务与全链路风险",
    sales: "跟进订单推进、尾款回收与交付协调",
    photographer: "专注拍摄排期、执行提醒和拍摄详情",
  };

  return `${roleLabels[role]}视角 · ${descriptions[role]}`;
}

export const statusClassName: Record<OrderStatus, string> = {
  待确认: "status-pill status-waiting",
  待拍摄: "status-pill status-progress",
  待选片: "status-pill status-progress",
  待交付: "status-pill status-delivery",
  已完成: "status-pill status-done",
};
