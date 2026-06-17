import { Outlet } from 'react-router-dom';
import Topbar from './Topbar.jsx';

const Layout = () => {
    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
