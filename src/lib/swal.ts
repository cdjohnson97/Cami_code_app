import SweetAlert from "sweetalert2";

type SwalOptions = Omit<Parameters<typeof SweetAlert.fire>[0], string>;

const CUSTOM_CLASSES = {
  popup: "cami-swal-popup",
  title: "cami-swal-title",
  content: "cami-swal-content",
  confirmButton: "cami-swal-confirm",
  cancelButton: "cami-swal-cancel",
  closeButton: "cami-swal-close",
};

const injectedStyles = new WeakSet<HTMLElement>();

function injectTheme(container: HTMLElement) {
  if (injectedStyles.has(container)) return;
  injectedStyles.add(container);

  const style = document.createElement("style");
  style.textContent = `
    .${CUSTOM_CLASSES.popup} {
      background: var(--paper) !important;
      border: 1px solid var(--line) !important;
      border-radius: var(--radius) !important;
      color: var(--ink) !important;
      box-shadow: var(--shadow-lg) !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.title} {
      color: var(--ink) !important;
      font-weight: 600 !important;
      font-size: 1.125rem !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.content} {
      color: var(--ink-soft) !important;
      font-size: 0.9375rem !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.confirmButton} {
      background: var(--accent) !important;
      border-color: var(--accent) !important;
      color: var(--accent-foreground) !important;
      border-radius: 9px !important;
      font-weight: 600 !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.confirmButton}:hover {
      filter: brightness(0.92) !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.cancelButton} {
      background: var(--bg) !important;
      border-color: var(--line-strong) !important;
      color: var(--ink-soft) !important;
      border-radius: 9px !important;
      font-weight: 600 !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.cancelButton}:hover {
      background: var(--line) !important;
    }
    .${CUSTOM_CLASSES.popup} .${CUSTOM_CLASSES.closeButton} {
      color: var(--ink-faint) !important;
    }
  `;
  container.appendChild(style);
}

export function swal(options: SwalOptions) {
  return SweetAlert.fire({
    ...(options as Record<string, unknown>),
    customClass: {
      popup: CUSTOM_CLASSES.popup,
      title: CUSTOM_CLASSES.title,
      confirmButton: CUSTOM_CLASSES.confirmButton,
      cancelButton: CUSTOM_CLASSES.cancelButton,
      closeButton: CUSTOM_CLASSES.closeButton,
      ...((options as Record<string, unknown>).customClass as Record<string, string> | undefined),
    },
    willOpen: (popup: HTMLElement) => {
      injectTheme(popup);
      (options as SwalOptions & { willOpen?: (popup: HTMLElement) => void }).willOpen?.(popup);
    },
  });
}

export default swal;
