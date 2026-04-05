export function initAdminUI(users) {
    const root = document.getElementById('root');
    root.innerHTML = `
        <h1>Admin Panel</h1>
        <table id="userTable">
            <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.name}</td>
                        <td>${u.email}</td>
                        <td>${u.status}</td>
                        <td>
                            <button onclick="toggleUser('${u.id}')">
                                ${u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.toggleUser = async (userId) => {
    try {
        const res = await fetch(`/api/admin/users/${userId}/toggle`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to toggle user status');
        location.reload();
    } catch (err) {
        console.error(err);
        alert('Error toggling user status');
    }
};
