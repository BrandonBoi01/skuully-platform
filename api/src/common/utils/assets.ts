export class Assets {
  private static baseUrl =
    process.env.PUBLIC_APP_URL?.trim() || "https://skuully.app";

  static url(path: string) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  static logoSquare() {
    return this.url("/logo.png");
  }

  static logoDark() {
    return this.url("/skuully-long-white-logo.svg");
  }

  static logoLight() {
    return this.url("/skuully-originallogo-originalname.svg");
  }

  static whiteIcon() {
    return this.url("/skuully-white-icon.svg");
  }

  static originalIcon() {
    return this.url("/skuully-original-icon.svg");
  }
}