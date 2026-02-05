declare module "react-google-recaptcha" {
  import type { Component } from "react";

  interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onError?: () => void;
    size?: "normal" | "compact" | "invisible";
    theme?: "light" | "dark";
    hl?: string;
    badge?: "bottomright" | "bottomleft" | "inline";
    className?: string;
  }

  class ReCAPTCHA extends Component<ReCAPTCHAProps> {
    /** Returns the token once the user solves the challenge (invisible variant). */
    executeAsync(): Promise<string | null>;
    /** Resets the widget back to its initial state. */
    reset(): void;
  }

  export default ReCAPTCHA;
}
