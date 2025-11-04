"use client"

import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, {
      label?: React.ReactNode
      icon?: React.ComponentType
    } | undefined>
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: Record<string, any>[]
    label?: string
  }
>(({ className, active, payload, label, ...props }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-white p-2 shadow-sm",
          className
        )}
        {...props}
      >
        <div className="grid grid-cols-2 gap-2">
          {payload.map((entry, index) => {
            return (
              <div key={`item-${index}`} className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  {entry.dataKey}
                </span>
                <span className="font-bold text-muted-foreground">
                  {entry.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
})
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: any[]
    label?: string
    indicator?: "line" | "dot" | "dashed" | "none"
    hideLabel?: boolean
    hideIndicator?: boolean
    formatter?: (value: any, name: any, props: any) => React.ReactNode[]
    labelFormatter?: (label: any, payload: any) => React.ReactNode
    nameKey?: string
  }
>(({
  className,
  active,
  payload,
  label,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  formatter,
  labelFormatter,
  nameKey = "dataKey",
  ...props
}, ref) => {
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${label || item?.payload?.[nameKey] || item?.[nameKey] || "value"}`

    if (labelFormatter && typeof labelFormatter === "function") {
      return labelFormatter(key, payload)
    }

    return key
  }, [label, payload, hideLabel, labelFormatter, nameKey])

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!hideLabel && tooltipLabel ? (
        <p className="text-muted-foreground">{tooltipLabel}</p>
      ) : null}
      {payload.map((item, index) => {
        const key = `${item[nameKey] || item.dataKey || "value"}`
        const itemConfig = item.payload

        return (
          <div
            key={item.dataKey}
            className={cn(
              "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
            )}
          >
            {formatter && typeof formatter === "function" ? (
              formatter(item.value, item.name, item)
            ) : (
              <>
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : (
                  !hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent":
                            indicator === "dashed",
                          hidden: indicator === "none",
                        }
                      )}
                      style={
                        {
                          "--color-bg": item.color,
                          "--color-border": item.color,
                        } as React.CSSProperties
                      }
                    />
                  )
                )}
                <div className={cn("flex flex-1 justify-between leading-none")}>
                  <div className="grid gap-1.5">
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name || key}
                    </span>
                  </div>
                  <span className="font-mono font-medium tabular-nums text-gray-900">
                    {item.value}
                  </span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
}