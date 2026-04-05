export async function fetchUsers() {
    const response = await fetch('/api/admin/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}
