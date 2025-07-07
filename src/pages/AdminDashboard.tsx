import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { fetchKeys } from '../services/keyService';
import { getApiProviders, getAuditLog } from '../services/keyService';
import { DollarSign, KeyRound, Users, Activity, Cpu, Cloud, Shield, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { message, Empty, Row, Col, Progress, List } from 'antd';
import { Card } from 'antd';
import { DashboardData, AdminKey, ManagedApiProvider } from '../types';

const AdminDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData>({
        totalKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        totalCredit: 0,
        totalActiveCredit: 0,
    });
    const [apiProviders, setApiProviders] = useState<ManagedApiProvider[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock billing data (thay bằng API thật nếu có)
    const billingStats = {
        totalRevenue: 398000,
        pendingRevenue: 99000,
        monthlyTransactions: 12,
        successRate: 91.7
    };

    // Mock API usage data (thay bằng API thật nếu có)  
    const apiUsageStats = {
        totalRequests: 8540,
        todayRequests: 1250,
        averageCost: 22.5,
        errorRate: 2.3
    };

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                // Load Keys data
                const keys: AdminKey[] = await fetchKeys();
                const mappedKeys = keys.map((key: any) => ({
                    ...key,
                    id: key._id,
                    isTrial: key.isTrial || false,
                    maxActivations: key.maxActivations || 1
                }));

                if (mappedKeys && mappedKeys.length > 0) {
                    const now = new Date();
                    const totalKeys = mappedKeys.length;
                    const activeKeys = mappedKeys.filter(k => k.isActive).length;
                    const expiredKeys = mappedKeys.filter(k => k.expiredAt && new Date(k.expiredAt) < now).length;
                    const totalCredit = mappedKeys.reduce((sum, k) => sum + (Number(k.credit) || 0), 0);
                    const totalActiveCredit = mappedKeys.filter(k => k.isActive).reduce((sum, k) => sum + (Number(k.credit) || 0), 0);
                    
                    setData({ totalKeys, activeKeys, expiredKeys, totalCredit, totalActiveCredit });
                }

                // Load API Providers data
                const providers = getApiProviders();
                setApiProviders(providers);

                // Load Audit Logs
                const logs = getAuditLog();
                setAuditLogs(logs.slice(0, 5)); // Chỉ lấy 5 log gần nhất

            } catch (error) {
                message.error('Không thể tải dữ liệu dashboard!');
            } finally {
                setLoading(false);
            }
        };
        getDashboardData();
    }, []);

    const formatNumber = (value: number) => value.toLocaleString('vi-VN');
    const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

    if (loading) {
        return <div className="text-center py-8">Đang tải dữ liệu...</div>;
    }

    const activeProviders = apiProviders.filter(p => p.status === 'Active').length;
    const totalDailyCost = apiProviders.reduce((sum, p) => sum + p.costToday, 0);

    return (
        <div className="space-y-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-800">Tổng Quan Hệ Thống</h1>
            
            {/* Key Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">📊 Thống Kê Key</h2>
                <Row gutter={16}>
                    <Col span={6}>
                        <StatCard 
                            title="Tổng Số Key" 
                            value={formatNumber(data.totalKeys)} 
                            Icon={KeyRound}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Key Đang Hoạt Động" 
                            value={formatNumber(data.activeKeys)} 
                            Icon={Users}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Key Đã Hết Hạn" 
                            value={formatNumber(data.expiredKeys)} 
                            Icon={Activity}
                            changeType="negative"
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Tổng Credit Hệ Thống" 
                            value={formatNumber(data.totalCredit)} 
                            Icon={DollarSign}
                        />
                    </Col>
                </Row>
            </div>

            {/* Billing Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">💰 Thống Kê Doanh Thu</h2>
                <Row gutter={16}>
                    <Col span={6}>
                        <StatCard 
                            title="Tổng Doanh Thu" 
                            value={formatCurrency(billingStats.totalRevenue)} 
                            Icon={CreditCard}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Doanh Thu Chờ Xử Lý" 
                            value={formatCurrency(billingStats.pendingRevenue)} 
                            Icon={TrendingUp}
                            changeType="negative"
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Giao Dịch Tháng Này" 
                            value={formatNumber(billingStats.monthlyTransactions)} 
                            Icon={Activity}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Tỷ Lệ Thành Công" 
                            value={`${billingStats.successRate}%`} 
                            Icon={Shield}
                        />
                    </Col>
                </Row>
            </div>

            {/* API Providers Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">🧠 Thống Kê API Providers</h2>
                <Row gutter={16}>
                    <Col span={6}>
                        <StatCard 
                            title="Tổng Số Providers" 
                            value={formatNumber(apiProviders.length)} 
                            Icon={Cpu}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Providers Hoạt Động" 
                            value={formatNumber(activeProviders)} 
                            Icon={Activity}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Chi Phí API Hôm Nay" 
                            value={`$${totalDailyCost.toFixed(2)}`} 
                            Icon={DollarSign}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Requests Hôm Nay" 
                            value={formatNumber(apiUsageStats.todayRequests)} 
                            Icon={Cloud}
                        />
                    </Col>
                </Row>
            </div>

            {/* API Usage Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">☁️ Thống Kê Sử Dụng API</h2>
                <Row gutter={16}>
                    <Col span={6}>
                        <StatCard 
                            title="Tổng Requests" 
                            value={formatNumber(apiUsageStats.totalRequests)} 
                            Icon={Cloud}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Chi Phí Trung Bình" 
                            value={`$${apiUsageStats.averageCost}`} 
                            Icon={DollarSign}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Tỷ Lệ Lỗi" 
                            value={`${apiUsageStats.errorRate}%`} 
                            Icon={AlertTriangle}
                            changeType={apiUsageStats.errorRate > 5 ? "negative" : undefined}
                        />
                    </Col>
                    <Col span={6}>
                        <StatCard 
                            title="Uptime" 
                            value="99.2%" 
                            Icon={Activity}
                        />
                    </Col>
                </Row>
            </div>

            {/* Recent Activity & Provider Status */}
            <Row gutter={16}>
                <Col span={12}>
                    <Card title="🛡️ Hoạt Động Gần Đây" size="small">
                        {auditLogs.length > 0 ? (
                            <List
                                size="small"
                                dataSource={auditLogs}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <div className="text-xs">
                                            <span className="text-gray-500">[{item.time}]</span>{' '}
                                            <span>{item.msg}</span>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="Chưa có hoạt động nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="🧠 Trạng Thái API Providers" size="small">
                        {apiProviders.length > 0 ? (
                            <div className="space-y-3">
                                {apiProviders.slice(0, 4).map(provider => (
                                    <div key={provider.id} className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{provider.provider}</span>
                                            <span className="text-xs text-gray-500 ml-2">({provider.nickname})</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs">${provider.costToday.toFixed(2)}</span>
                                            <div className={`w-2 h-2 rounded-full ${
                                                provider.status === 'Active' ? 'bg-green-500' : 
                                                provider.status === 'Error' ? 'bg-red-500' : 'bg-gray-400'
                                            }`}></div>
                                        </div>
                                    </div>
                                ))}
                                {apiProviders.length > 4 && (
                                    <div className="text-center text-gray-500 text-xs">
                                        +{apiProviders.length - 4} providers khác
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Empty description="Chưa có API providers nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard; 