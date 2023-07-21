import {Form} from '@remix-run/react';
import {Button} from '~/components/ui/button';
import {ROUTES} from '~/constants';

export default function Login() {
  return (
    <div className="flex justify-center mt-5 w-full ">
      <Form action={ROUTES.AUTH} method="post">
        <Button>Login</Button>
      </Form>
    </div>
  );
}
