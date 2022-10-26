export class DigitalWallets {
  private stripeIteration = 0;
  private dwContainer = document.querySelector(
    "#en__digitalWallet"
  ) as HTMLElement;
  private sbContainer = document.querySelector(".en__submit") as HTMLElement;
  constructor() {
    this.log("Debug mode is on");
    if (!this.shouldRun()) {
      this.logError("Not Running");
      return;
    }

    // Document Load
    if (document.readyState !== "loading") {
      this.run();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        this.run();
      });
    }
  }
  private shouldRun(): boolean {
    return !!this.getPageId() && !!this.dwContainer && !!this.sbContainer;
  }
  private run() {
    if (this.stripeIteration >= 10) {
      this.logError("Stripe Failed to load - Aborting");
      return;
    }
    while (
      !this.checkNested(
        (window as any).EngagingNetworks,
        "require",
        "_defined",
        "enStripeButtons",
        "stripeButtons",
        "paymentRequest",
        "canMakePayment"
      )
    ) {
      this.log("Waiting for Stripe");
      window.setTimeout(() => {
        this.stripeIteration++;
        this.run();
      }, 10);
      return;
    }
    this.checkDebug();
    (
      window as any
    ).EngagingNetworks.require._defined.enStripeButtons.stripeButtons.paymentRequest
      .canMakePayment()
      .then((result: any) => {
        if (result) {
          this.log("Enabled");
          this.renderDwPaymentOption();
          this.addEventListeners();
          // Check Local Storage
          const dwChoice = localStorage.getItem(`dwChoice-${this.getPageId()}`);
          if (dwChoice === "true") {
            this.checkDigitalWallets();
          }
        } else {
          this.logError("Disabled");
          this.hideDwContainer();
        }
      });
  }

  private renderDwPaymentOption() {
    const paymentTypeContainer = document.querySelector(
      ".payment-opts .en__component--formblock"
    ) as HTMLElement;
    if (!paymentTypeContainer) return;
    const dwPaymentOption = document.createElement("div");
    dwPaymentOption.classList.add("en__field");
    dwPaymentOption.classList.add("en__field--checkbox");
    dwPaymentOption.classList.add("en__field--payment-method-digital-wallets");
    dwPaymentOption.innerHTML = `
        <div class="en__field__element en__field__element--checkbox">
          <div class="en__field__item"><span class="button-trigger"></span>
            <input id="en__field_digital_wallets" type="checkbox" class="en__field__input en__field__input--checkbox" value="Y" name="en__field_digital_wallets">
            <label for="en__field_digital_wallets" class="en__field__label en__field__label--item">Digital Wallets</label>
          </div>
        </div>
    `;
    paymentTypeContainer.appendChild(dwPaymentOption);
  }
  private addEventListeners() {
    const dwCheckbox = document.querySelector(
      ".en__field--payment-method-digital-wallets input"
    ) as HTMLInputElement;
    const dwButton = document.querySelector(
      ".en__field--payment-method-digital-wallets .button-trigger"
    ) as HTMLElement;
    const paymentOptions = document.querySelectorAll(
      ".payment-opts input"
    ) as NodeListOf<HTMLInputElement>;
    if (!dwCheckbox || !dwButton) return;
    dwCheckbox.addEventListener("change", () => {
      if (dwCheckbox.checked) {
        this.checkDigitalWallets();
      } else {
        // Go back to Credit Card
        if (paymentOptions.length > 0) paymentOptions[0].checked = true;
        this.uncheckDigitalWallets();
      }
    });
    dwButton.addEventListener("click", () => {
      dwCheckbox.click();
    });
    paymentOptions.forEach((option) => {
      option.addEventListener("change", () => {
        if (option.name !== "en__field_digital_wallets") {
          this.uncheckDigitalWallets();
          dwCheckbox.checked = false;
        }
      });
    });
  }

  private showDwContainer() {
    this.dwContainer.style.display = "block";
  }
  private hideDwContainer() {
    this.dwContainer.style.display = "none";
  }
  private hideSubmitButton() {
    this.sbContainer.style.display = "none";
  }
  private showSubmitButton() {
    this.sbContainer.style.display = "block";
  }
  private checkDigitalWallets() {
    const paymentOptions = document.querySelectorAll(
      ".payment-opts input[type=radio]"
    ) as NodeListOf<HTMLInputElement>;
    const payMethods = document.querySelector(".payMethods") as HTMLDivElement;
    this.showDwContainer();
    this.hideSubmitButton();
    (window as any).EngagingNetworks.require._defined.enjs.setFieldValue(
      "paymenttype",
      "digitalwallets"
    );
    // Uncheck Paypal
    const paypalContainer = document.querySelector(
      ".ppal-active"
    ) as HTMLElement;
    if (paypalContainer) {
      paypalContainer.classList.remove("ppal-active");
      const paypalSelected = paypalContainer.querySelector(
        ".paypal-selected"
      ) as HTMLElement;
      if (paypalSelected) {
        paypalSelected.classList.remove("paypal-selected");
        const paypalActive = paypalContainer.querySelector(
          ".en__field--payment-method-paypal .is-active"
        ) as HTMLElement;
        if (paypalActive) paypalActive.classList.remove("is-active");
        const paypalInput = paypalContainer.querySelector(
          ".en__field--payment-method-paypal input"
        ) as HTMLInputElement;
        if (paypalInput) paypalInput.checked = false;
        const paypalNote = document.querySelector("#ppal-note") as HTMLElement;
        if (paypalNote) paypalNote.style.display = "none";
      }
    }
    paymentOptions.forEach((option) => {
      option.checked = false;
    });
    if (payMethods) payMethods.classList.add("en__hidden");
    // Store choice on LocalStorage
    localStorage.setItem(`dwChoice-${this.getPageId()}`, "true");
    const dwInput = document.querySelector(
      "#en__field_digital_wallets"
    ) as HTMLInputElement;
    if (dwInput) dwInput.checked = true;
  }
  private parseENDependencies() {
    return (
      window as any
    ).EngagingNetworks.require._defined.enDependencies.dependencies.parseDependencies(
      (window as any).EngagingNetworks.dependencies
    );
  }
  private uncheckDigitalWallets() {
    const payMethods = document.querySelector(".payMethods") as HTMLDivElement;
    this.hideDwContainer();
    this.showSubmitButton();
    if (payMethods) payMethods.classList.remove("en__hidden");
    // Store choice on LocalStorage
    localStorage.setItem(`dwChoice-${this.getPageId()}`, "false");
    const dwInput = document.querySelector(
      "#en__field_digital_wallets"
    ) as HTMLInputElement;
    if (dwInput) dwInput.checked = false;
    this.parseENDependencies();
  }
  private getPageId() {
    if ("pageJson" in window) return (window as any)?.pageJson?.campaignPageId;
    return 0;
  }

  private isDebug() {
    const regex = new RegExp("[\\?&]debug=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
  private checkDebug() {
    if (this.isDebug()) {
      document.querySelector("body")?.setAttribute("data-debug", "true");
    }
  }
  private log(message: string) {
    if (this.isDebug())
      console.log(
        `%c4Site Digital Wallets - ${message} `,
        "color: white; background: green; font-size: 1.2rem; font-weight: bold; padding: 2px; border-radius: 2px;"
      );
  }
  private logError(message: string) {
    if (this.isDebug())
      console.log(
        `%c4Site Digital Wallets - ${message} `,
        "color: white; background: red; font-size: 1.2rem; font-weight: bold; padding: 2px; border-radius: 2px;"
      );
  }
  private checkNested(obj: any, ...args: string[]) {
    for (let i = 0; i < args.length; i++) {
      if (!obj || !Object.getOwnPropertyDescriptor(obj, args[i])) {
        return false;
      }
      obj = obj[args[i]];
    }
    return true;
  }
}
