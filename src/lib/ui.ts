import { roleLabels, type UserRole } from "@/lib/auth";
import type { OrderStatus } from "@/lib/mock-data";

export const navigationItems = [
  {
    label: "工作台",
    href: "/",
    roles: [
      "owner",
      "sales",
      "production_manager",
      "finance_director",
      "delivery_manager",
      "photographer",
    ] as UserRole[],
  },
  {
    label: "订单管理",
    href: "/orders",
    roles: [
      "owner",
      "sales",
      "production_manager",
      "finance_director",
      "delivery_manager",
      "photographer",
    ] as UserRole[],
  },
  { label: "人员管理", href: "/staff", roles: ["owner"] as UserRole[] },
  { label: "账务流水", href: "/finance", roles: ["owner", "finance_director"] as UserRole[] },
  {
    label: "拍摄排期",
    href: "/schedule",
    roles: ["owner", "production_manager", "delivery_manager", "photographer"] as UserRole[],
  },
  {
    label: "提醒中心",
    href: "/alerts",
    roles: ["owner", "sales", "production_manager", "delivery_manager", "photographer"] as UserRole[],
  },
  {
    label: "交付中心",
    href: "/delivery",
    roles: ["owner", "production_manager", "delivery_manager"] as UserRole[],
  },
];

export function getNavigationForRole(role: UserRole) {
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function getRoleSummary(role: UserRole) {
  const descriptions: Record<UserRole, string> = {
    owner: "查看经营看板、全部财务与全链路风险",
    sales: "负责接单建单，只看订单管理和提醒中心",
    production_manager: "负责排期、安排导演与拍摄执行、统筹拍摄进度",
    finance_director: "负责全部财务流水和整体经营数据",
    delivery_manager: "负责交付推进、执行追踪和交付超期风险",
    photographer: "专注自己参与的拍摄任务与执行提醒",
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
