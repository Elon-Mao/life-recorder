export default interface VanAction {
  name: string
  execute: () => void
  color?: string
  disabled?: boolean
}