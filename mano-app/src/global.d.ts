declare global {
  interface HTMLElement {
    onbeforematch?: ((event: Event) => void) | null;
  }
}

export {};
