export type OrderStatus = "待确认" | "待拍摄" | "待选片" | "待交付" | "已完成";

export type FinanceEntryType = "收款" | "退款" | "支出";

export type FinanceEntry = {
  id: string;
  type: FinanceEntryType;
  title: string;
  amount: string;
  time: string;
  orderId?: string;
  orderLabel?: string;
  category?: string;
  counterparty?: string;
  notes?: string;
};

export type Order = {
  id: string;
  customer: string;
  contact: string;
  school: string;
  campus: string;
  className: string;
  shootDate: string;
  location: string;
  packageName: string;
  amount: string;
  paid: string;
  status: OrderStatus;
  photographer?: string;
  salesOwner?: string;
  director?: string;
  assistantPhotographer?: string;
  leadVideographer?: string;
  assistantVideographer?: string;
  deliveryDueDate?: string;
};

export const dashboardStats = [
  {
    label: "本月订单",
    value: "38",
    change: "+12%",
    detail: "较上月新增 4 个园区拍摄档期",
  },
  {
    label: "本月已收款",
    value: "¥126,800",
    change: "+18%",
    detail: "含毕业照套餐、加拍与相册增购",
  },
  {
    label: "待拍摄场次",
    value: "9",
    change: "本周 4 场",
    detail: "需要确认摄影师、车辆与道具",
  },
  {
    label: "未收尾款",
    value: "¥23,400",
    change: "11 单",
    detail: "主要集中在选片完成待交付的订单",
  },
];

export const orders: Order[] = [
  {
    id: "ORD-240428-01",
    customer: "星辰幼儿园大一班",
    contact: "刘老师 · 138****1288",
    school: "星辰幼儿园",
    campus: "滨江园区",
    className: "大一班",
    shootDate: "2026-05-03 08:30",
    location: "滨江园区操场",
    packageName: "毕业纪念全套",
    amount: "¥8,600",
    paid: "¥4,000",
    status: "待拍摄" as OrderStatus,
    photographer: "阿峰",
    salesOwner: "小林",
    director: "浩然",
    assistantPhotographer: "安安",
    leadVideographer: "子瑜",
    assistantVideographer: "",
    deliveryDueDate: "2026-05-12",
  },
  {
    id: "ORD-240428-02",
    customer: "阳光幼儿园毕业季",
    contact: "张园长 · 139****6601",
    school: "阳光幼儿园",
    campus: "总园",
    className: "毕业季联拍",
    shootDate: "2026-05-04 13:30",
    location: "总园礼堂 + 草坪",
    packageName: "班级合影 + 外景",
    amount: "¥12,800",
    paid: "¥12,800",
    status: "待选片" as OrderStatus,
    photographer: "子瑜",
    salesOwner: "小禾",
    director: "浩然",
    assistantPhotographer: "阿峰",
    leadVideographer: "安安",
    assistantVideographer: "",
    deliveryDueDate: "2026-05-15",
  },
  {
    id: "ORD-240428-03",
    customer: "启明星小学六年级",
    contact: "陈老师 · 136****9917",
    school: "启明星小学",
    campus: "东校区",
    className: "六年级",
    shootDate: "2026-05-06 09:00",
    location: "东校区礼堂",
    packageName: "毕业典礼跟拍",
    amount: "¥15,200",
    paid: "¥6,000",
    status: "待拍摄" as OrderStatus,
    photographer: "安安",
    salesOwner: "小林",
    director: "周策",
    assistantPhotographer: "子瑜",
    leadVideographer: "阿峰",
    assistantVideographer: "",
    deliveryDueDate: "2026-05-18",
  },
  {
    id: "ORD-240428-04",
    customer: "贝贝幼儿园学前二班",
    contact: "王老师 · 137****3015",
    school: "贝贝幼儿园",
    campus: "城南园区",
    className: "学前二班",
    shootDate: "2026-04-29 15:00",
    location: "城南园区多功能厅",
    packageName: "证件照 + 集体照",
    amount: "¥4,200",
    paid: "¥4,200",
    status: "待交付" as OrderStatus,
    photographer: "阿峰",
    salesOwner: "小禾",
    director: "周策",
    assistantPhotographer: "",
    leadVideographer: "子瑜",
    assistantVideographer: "安安",
    deliveryDueDate: "2026-05-02",
  },
];

export const seedOrders = orders;

export const financeEntries: FinanceEntry[] = [
  {
    id: "FIN-240428-01",
    type: "收款" as FinanceEntryType,
    title: "星辰幼儿园定金",
    amount: "+¥4,000",
    time: "今天 10:20",
    orderId: "ORD-240428-01",
    orderLabel: "星辰幼儿园大一班",
    category: "订单定金",
    counterparty: "刘老师",
  },
  {
    id: "FIN-240428-02",
    type: "支出" as FinanceEntryType,
    title: "外景拍摄交通费",
    amount: "-¥360",
    time: "今天 09:15",
    category: "交通支出",
    counterparty: "滴滴企业出行",
  },
  {
    id: "FIN-240428-03",
    type: "收款" as FinanceEntryType,
    title: "阳光幼儿园尾款",
    amount: "+¥5,800",
    time: "昨天 18:40",
    orderId: "ORD-240428-02",
    orderLabel: "阳光幼儿园毕业季",
    category: "订单尾款",
    counterparty: "张园长",
  },
  {
    id: "FIN-240428-04",
    type: "收款" as FinanceEntryType,
    title: "阳光幼儿园定金",
    amount: "+¥7,000",
    time: "昨天 09:30",
    orderId: "ORD-240428-02",
    orderLabel: "阳光幼儿园毕业季",
    category: "订单定金",
    counterparty: "张园长",
  },
  {
    id: "FIN-240428-05",
    type: "收款" as FinanceEntryType,
    title: "启明星小学首笔款",
    amount: "+¥6,000",
    time: "04-27 16:20",
    orderId: "ORD-240428-03",
    orderLabel: "启明星小学六年级",
    category: "订单定金",
    counterparty: "陈老师",
  },
  {
    id: "FIN-240428-06",
    type: "收款" as FinanceEntryType,
    title: "贝贝幼儿园全款",
    amount: "+¥4,200",
    time: "04-27 10:10",
    orderId: "ORD-240428-04",
    orderLabel: "贝贝幼儿园学前二班",
    category: "订单全款",
    counterparty: "王老师",
  },
  {
    id: "FIN-240428-07",
    type: "退款" as FinanceEntryType,
    title: "相册加印取消退款",
    amount: "-¥200",
    time: "昨天 11:05",
    category: "售后退款",
    counterparty: "家长退款",
  },
];

export const seedFinanceEntries = financeEntries;

export const reminders = [
  {
    title: "明天拍摄：贝贝幼儿园学前二班",
    detail: "15:00 开拍，需携带班级号码贴和泡泡机",
    level: "高优先级",
  },
  {
    title: "今日回款跟进：启明星小学六年级",
    detail: "客户承诺今天补齐第二笔款项 ¥3,000",
    level: "财务提醒",
  },
  {
    title: "待交片：阳光幼儿园毕业季",
    detail: "精修 48 张，需在 4 月 30 日前交付云相册",
    level: "交付节点",
  },
];
