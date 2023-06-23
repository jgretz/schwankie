import * as R from 'ramda';

type Param = [string, string | number | null | undefined];

export function appendParams(url: string, params: Param[]) {
  return params.reduce((acc, param) => {
    const [key, value] = param;

    if (!value) {
      return acc;
    }

    return acc + new URLSearchParams({[key]: R.toString(value)});
  }, url);
}
