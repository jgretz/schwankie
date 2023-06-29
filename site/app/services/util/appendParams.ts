type Param = [string, string | number | null | undefined];

export function appendParams(url: string, params: Param[]) {
  const paramsObj = params.reduce((acc, [key, value]) => {
    if (!value) {
      return acc;
    }

    return {
      ...acc,
      [key]: value,
    };
  }, {});

  return url + new URLSearchParams(paramsObj);
}
