export const SITE_NAME = "EventQR";
export const DEFAULT_TITLE = "QR Event Management Platform by Magitecx";
export const DEFAULT_DESCRIPTION =
  "EventQR by Magitecx helps organizers manage events with QR attendance tracking, check-ins, and event management tools.";
export const SUPPORT_EMAIL = "support@magitecx.com";
export const BRAND_LOGO_PATH = "/logo.png";

export function getSiteUrl() {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL;

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5173";
}

export function getCanonicalUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function buildTitle(title?: string) {
  return title ? `${SITE_NAME} | ${title}` : `${SITE_NAME} | ${DEFAULT_TITLE}`;
}

export function getAbsoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: getAbsoluteUrl(BRAND_LOGO_PATH),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      url: `${getSiteUrl()}/contact`,
    },
  };
}

export function buildWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
  };
}

export function buildBreadcrumbStructuredData(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}
