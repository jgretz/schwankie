import {Outlet} from '@remix-run/react';
import {Navbar} from './_components/navbar';

export default function AdminLayout() {
  return (
    <div className="pb-5">
      <Navbar />
      <Outlet />
    </div>
  );
}
