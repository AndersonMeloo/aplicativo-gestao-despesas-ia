import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import EmptyState from './EmptyState.jsx';
import CategoryBadge from './CategoryBadge.jsx';
import KpidCard from './KpiCard.jsx';
import Topbar from './Topbar.jsx';

const Layout = () => {
    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <CategoryBadge name="Example Category" icon="tag" color="#3B82F6" size="md" />
                <EmptyState
                    icon={null}
                    title="No Data Available"
                    description="There is currently no data to display. Please add some data to see it here."
                    action={<button className="px-4 py-2 bg-blue-500 text-white rounded">Add Data</button>}
                />
                <KpidCard
                    label="Total Revenue"
                    value="$12,345"
                    delta={5.2}
                    icon={null}
                    accent="blue"
                />

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
