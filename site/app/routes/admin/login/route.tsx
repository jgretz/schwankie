import {Form} from '@remix-run/react';

export default function Login() {
  return (
    <Form action="/admin/auth/google" method="post">
      <button>Login with Google</button>
    </Form>
  );
}
