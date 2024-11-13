export function encodeQueryStringFromJsonObject(object: {[key: string]: any}) {
  return Object.keys(object)
    .reduce((acc, key) => {
      const value = object[key];
      if (value === null || value === undefined) {
        return acc;
      }

      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);

      return `${acc}&${encodedKey}=${encodedValue}`;
    }, '')
    .slice(1);
}
