import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 项目主用 variant —— 深色反色按钮（前景色做背景）
        default:
          "bg-foreground text-background hover:opacity-85 active:scale-[0.98]",
        // 品牌色按钮
        brand:
          "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97]",
        // 标准 shadcn variant
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:border-muted-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent",
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // 标准尺寸
        sm: "h-8 rounded-[8px] px-3 text-[12px]",
        default: "h-9 rounded-[10px] px-4 text-[14px]",
        lg: "h-11 rounded-[12px] px-5 text-[14px]",
        icon: "size-9 rounded-[10px]",
        "icon-sm": "size-8 rounded-[8px]",
        "icon-lg": "size-11 rounded-[12px]",
        // 项目专用尺寸
        search: "h-9 rounded-[10px] px-5 text-[14px] font-semibold",
        pill: "h-12 rounded-full px-8 text-[14px]",
        "pill-sm": "h-[30px] rounded-full px-3 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
