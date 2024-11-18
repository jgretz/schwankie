import {Form} from '@remix-run/react';
import {ROUTES} from '@www/constants/routes.constants';
import {Button} from '@www/components/ui/button';

export default function Login() {
  return (
    <div className="flex justify-center mt-5 w-full ">
      <Form action={ROUTES.AUTH} method="post">
        <Button>Login</Button>
      </Form>
    </div>
  );
}
