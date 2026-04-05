import { initAdminUI } from './adminUI.js';
import { fetchUsers } from './userManagement.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const users = await fetchUsers();
        initAdminUI(users);
    } catch (err) {
        console.error('Admin UI failed', err);
        const root = document.getElementById('root');
        root.innerHTML = '<p>Error loading admin panel.</p>';
    }
});
