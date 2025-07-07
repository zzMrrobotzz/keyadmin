import React, { useState, useEffect } from 'react';
import { Table, Tag, message, Card as AntdCard } from 'antd';
import { ApiStatus } from '../types';

// Mock API status data (sẽ thay bằng API thật sau)
const mockApiStatus: ApiStatus[] = [
    { id: '1', provider: 'Gemini', status: 'Operational', requestsToday: 1250, costToday: 15.2, rateLimitUsage: 35 },
    { id: '2', provider: 'OpenAI', status: 'Degraded', requestsToday: 800, costToday: 22.5, rateLimitUsage: 70 },
    { id: '3', provider: 'Stability AI', status: 'Operational', requestsToday: 540, costToday: 12.8, rateLimitUsage: 25 },
    { id: '4', provider: 'ElevenLabs', status: 'Error', requestsToday: 50, costToday: 1.5, rateLimitUsage: 95 },
];

const AdminApiMonitoring: React.FC = () => {
    const [apiData, setApiData] = useState<ApiStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Thay bằng API thật nếu có
        setApiData(mockApiStatus);
        setLoading(false);
    }, []);

    const getStatusIndicator = (status: 'Operational' | 'Degraded' | 'Error') => {
        switch (status) {
            case 'Operational':
                return <Tag color="green">Operational</Tag>;
            case 'Degraded':
                return <Tag color="orange">Degraded</Tag>;
            case 'Error':
                return <Tag color="red">Error</Tag>;
            default:
                return <Tag>Unknown</Tag>
        }
    };
    
    const columns = [
        { title: 'Nhà Cung Cấp', dataIndex: 'provider', key: 'provider' },
        { title: 'Trạng Thái', dataIndex: 'status', key: 'status', render: getStatusIndicator },
        { title: 'Requests Hôm Nay', dataIndex: 'requestsToday', key: 'requestsToday', render: (val: number) => val.toLocaleString() },
        { title: 'Chi phí Ước tính', dataIndex: 'costToday', key: 'costToday', render: (val: number) => `$${val.toFixed(2)}` },
        { title: 'Sử dụng Rate Limit', dataIndex: 'rateLimitUsage', key: 'rateLimitUsage', render: (val: number) => `${val}%` },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-800">Theo Dõi & Sức Khỏe API</h1>
            <AntdCard>
                <Table 
                    dataSource={apiData} 
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                />
            </AntdCard>
        </div>
    );
};

export default AdminApiMonitoring; 