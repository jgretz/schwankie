import {Form} from '@remix-run/react';
import {ADMIN_ROUTES} from './constants';
import {Button} from '@www/components/ui/button';

export default function Login() {
  return (
    <div className="flex justify-center mt-5 w-full ">
      <Form action={ADMIN_ROUTES.AUTH} method="post">
        <Button>Login</Button>
      </Form>
    </div>
  );
}
