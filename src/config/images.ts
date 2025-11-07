/**
 * Image configuration and optimization settings
 */

export const IMAGE_CONFIG = {
  // CDN base URL for images (can be configured per environment)
  CDN_BASE_URL: process.env.NEXT_PUBLIC_CDN_URL || '',
  
  // Supported image formats in order of preference
  SUPPORTED_FORMATS: ['webp', 'avif', 'png', 'jpg', 'svg'] as const,
  
  // Image quality settings
  QUALITY: {
    HIGH: 90,
    MEDIUM: 75,
    LOW: 60,
  },
  
  // Responsive breakpoints for image optimization
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1280,
  },
} as const;

/**
 * Generates optimized image URL with CDN support
 */
export const getOptimizedImageUrl = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string => {
  // If no CDN configured, return original URL
  if (!IMAGE_CONFIG.CDN_BASE_URL) {
    return src;
  }

  const { width, height, quality = IMAGE_CONFIG.QUALITY.MEDIUM, format } = options;
  const params = new URLSearchParams();

  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', quality.toString());
  if (format) params.set('f', format);

  const queryString = params.toString();
  const separator = src.includes('?') ? '&' : '?';
  
  return `${IMAGE_CONFIG.CDN_BASE_URL}${src}${queryString ? separator + queryString : ''}`;
};

/**
 * Generates responsive image srcset for different screen sizes
 */
export const generateResponsiveSrcSet = (
  src: string,
  sizes: number[] = [640, 768, 1024, 1280]
): string => {
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { width: size })} ${size}w`)
    .join(', ');
};

/**
 * Image URL validator with comprehensive security checks and caching
 */
class ImageUrlValidator {
  private static instance: ImageUrlValidator;
  private validationCache = new Map<string, boolean>();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_URL_LENGTH = 2048;
  private readonly MIN_URL_LENGTH = 4;

  static getInstance(): ImageUrlValidator {
    if (!ImageUrlValidator.instance) {
      ImageUrlValidator.instance = new ImageUrlValidator();
    }
    return ImageUrlValidator.instance;
  }

  validate(url: string): boolean {
    // Check cache first
    if (this.validationCache.has(url)) {
      return this.validationCache.get(url)!;
    }

    // Manage cache size
    if (this.validationCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU-like behavior)
      const firstKey = this.validationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.validationCache.delete(firstKey);
      }
    }

    const isValid = this.performValidation(url);
    this.validationCache.set(url, isValid);
    return isValid;
  }

  private performValidation(url: string): boolean {
    try {
      // Basic input validation
      if (!url || typeof url !== 'string' || 
          url.length > this.MAX_URL_LENGTH || 
          url.length < this.MIN_URL_LENGTH) {
        return false;
      }

      // Prevent common attack vectors
      if (this.containsMaliciousPatterns(url)) {
        return false;
      }

      const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
      
      // Protocol validation
      if (!this.isValidProtocol(parsedUrl.protocol)) {
        return false;
      }

      // HTTPS preference in production
      this.checkHttpsPreference(parsedUrl, url);

      // Extension validation
      if (!this.hasValidImageExtension(parsedUrl.pathname)) {
        return false;
      }

      // External URL security checks
      return this.validateExternalUrl(parsedUrl);

    } catch (error) {
      console.warn('Image URL validation error:', error);
      return false;
    }
  }

  private containsMaliciousPatterns(url: string): boolean {
    // Combine related patterns for better performance
    const maliciousPatterns = [
      /<script|javascript:|vbscript:|data:|file:/i, // Script injections
      /[<>'"&\x00-\x1f\x7f-\x9f]/, // XSS and control characters
      /\.\.\/|%2e%2e%2f/i, // Path traversal (combined)
      /\b(eval|alert|document)\b/i, // XSS keywords (combined)
      /\bon\w+=/i, // Event handlers
      /^(ftp|blob):/i, // Blocked protocols (combined)
      /%00|\\\\/, // Null byte and UNC paths (combined)
    ];

    return maliciousPatterns.some(pattern => pattern.test(url));
  }

  private isValidProtocol(protocol: string): boolean {
    return ['http:', 'https:'].includes(protocol);
  }

  private checkHttpsPreference(parsedUrl: URL, originalUrl: string): void {
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
      console.warn(`Non-HTTPS image URL detected in production: ${originalUrl}`);
    }
  }

  private hasValidImageExtension(pathname: string): boolean {
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;
    return validExtensions.test(pathname);
  }

  private validateExternalUrl(parsedUrl: URL): boolean {
    const isExternalUrl = parsedUrl.origin !== (typeof window !== 'undefined' ? window.location.origin : '');
    
    if (isExternalUrl) {
      // Block localhost and private IP ranges for external images
      const hostname = parsedUrl.hostname;
      const isPrivateIP = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost)/.test(hostname);
      
      if (isPrivateIP) {
        return false;
      }

      // Additional checks for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 't.co'];
      if (suspiciousDomains.some(domain => hostname.includes(domain))) {
        console.warn(`Potentially suspicious domain detected: ${hostname}`);
      }
    }

    return true;
  }
}

/**
 * Validates image URL format and security with comprehensive checks
 */
export const isValidImageUrl = (url: string): boolean => {
  return ImageUrlValidator.getInstance().validate(url);
};