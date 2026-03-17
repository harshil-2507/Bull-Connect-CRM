"use client"

interface Props {
  checked: boolean
  onCheckedChange: () => void
}

export function Checkbox({ checked, onCheckedChange }: Props) {

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onCheckedChange}
      className="h-4 w-4 cursor-pointer"
    />
  )
}