import React from 'react';

import Header from "./Header";


export default function DashboardLayout({ children }) {
    return (
        <div >
            <Header />
            {children}
        </div>
    )
};
