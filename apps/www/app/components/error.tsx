import {isRouteErrorResponse, useRouteError} from '@remix-run/react';

export function Error() {
  const error = useRouteError();
  let status = 500;
  let message = 'An unexpected error occurred.';
  if (isRouteErrorResponse(error)) {
    status = error.status;
    switch (error.status) {
      case 404:
        message = 'Page Not Found';
        break;
    }
  } else {
    console.error(error);
  }

  return (
    <div className="container prose py-8">
      <h1>{status}</h1>
      <p>{message}</p>
    </div>
  );
}
