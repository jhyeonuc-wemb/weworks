/**
 * Transforms a snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Transforms a camelCase string to snake_case
 */
export function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Deeply transforms all object keys from snake_case to camelCase
 * Useful for mapping Raw DB rows to standard TypeScript DTOs.
 */
export function mapToCamelCase<T>(obj: any): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return obj as any;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => mapToCamelCase(item)) as any;
    }

    const newObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        newObj[toCamelCase(key)] = mapToCamelCase(value);
    }

    return newObj as T;
}

/**
 * Deeply transforms all object keys from camelCase to snake_case
 * Useful for preparing TypeScript objects for DB insertion.
 */
export function mapToSnakeCase<T>(obj: any): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return obj as any;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => mapToSnakeCase(item)) as any;
    }

    const newObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        newObj[toSnakeCase(key)] = mapToSnakeCase(value);
    }

    return newObj as T;
}
