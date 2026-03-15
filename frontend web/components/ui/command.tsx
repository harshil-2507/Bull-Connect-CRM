"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl",
        "bg-white/80 dark:bg-slate-900/80",
        "backdrop-blur-2xl",
        "text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for anything...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>

      {/* BACKDROP OVERLAY */}
      <DialogOverlay className="bg-black/40 backdrop-blur-md" />

      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <DialogContent
        className={cn(
          "overflow-hidden p-0",
          "shadow-2xl",
          "border border-border/40",
          "rounded-2xl",
          "max-w-xl",
          "scale-95 data-[state=open]:scale-100",
          "transition-all duration-200",
          className
        )}
        showCloseButton={showCloseButton}
      >
        <Command className="
          [&_[cmdk-group-heading]]:px-3
          [&_[cmdk-group-heading]]:pt-3
          [&_[cmdk-group-heading]]:pb-1
          [&_[cmdk-group-heading]]:text-xs
          [&_[cmdk-group-heading]]:font-semibold
          [&_[cmdk-group-heading]]:text-muted-foreground
          [&_[cmdk-group]]:px-2
          [&_[cmdk-item]]:px-3
          [&_[cmdk-item]]:py-2
        ">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="
        flex items-center gap-2
        border-b
        px-4
        h-12
      "
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />

      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex w-full bg-transparent",
          "text-sm outline-none",
          "placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[420px] overflow-y-auto overflow-x-hidden",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-10 text-center text-sm text-muted-foreground"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("py-1", className)}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("my-2 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex items-center gap-2",
        "rounded-md px-3 py-2 text-sm",
        "cursor-pointer select-none",
        "transition-colors",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}