import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { fetchDashboardData } from '../services/api';

export default function DashboardScreen() {
  const [data, setData] = useState({ users: 0, transactions: 0, revenue: 0 });

  useEffect(() => {
    async function loadData() {
      const res = await fetchDashboardData();
      setData(res);
    }
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FinanceBot Dashboard</Text>
      <Text>Total Users: {data.users}</Text>
      <Text>Total Transactions: {data.transactions}</Text>
      <Text>Total Revenue: ${data.revenue.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }
});
