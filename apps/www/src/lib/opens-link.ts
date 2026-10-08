// Primary (0) and middle (1) clicks open an <a>; right-click (2) only opens the context menu.
export function opensLink(button: number): boolean {
  return button === 0 || button === 1;
}
