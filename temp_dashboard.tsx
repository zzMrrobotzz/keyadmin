import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { fetchKeys, fetchDashboardStats, fetchAuditLogs, fetchApiProviders } from '../services/keyService';
import { DollarSign, KeyRound, Users, Activity, Cpu, Cloud, Shield, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { message, Empty, Row, Col, List, Card as AntCard, Spin } from 'antd';
import { AdminKey, ManagedApiProvider } from '../types';

// Helper Ä‘á»ƒ Ä‘á»‹nh dáº¡ng sá»‘ vÃ  tiá»n tá»‡
const formatNumber = (value: number) => (value || 0).toLocaleString('vi-VN');
const formatCurrency = (value: number) => `${(value || 0).toLocaleString('vi-VN')} VNÄ`;

const AdminDashboard: React.FC = () => {
    // State cho tá»«ng pháº§n dá»¯ liá»‡u
    const [keyStats, setKeyStats] = useState({ total: 0, active: 0, expired: 0 });
    const [billingStats, setBillingStats] = useState({ totalRevenue: 0, monthlyTransactions: 0 });
    const [apiUsageStats, setApiUsageStats] = useState({ totalRequests: 0, costToday: 0 });
    const [apiProviders, setApiProviders] = useState<ManagedApiProvider[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                setLoading(true);
                
                // Gá»i song song cÃ¡c API Ä‘á»ƒ táº£i nhanh hÆ¡n
                const [keysData, statsData, providersData, logsData] = await Promise.all([
                    fetchKeys(),
                    fetchDashboardStats(),
                    fetchApiProviders(),
                    fetchAuditLogs()
                ]);

                // Xá»­ lÃ½ vÃ  cáº­p nháº­t state cho Key
                if (keysData && keysData.length > 0) {
                    const now = new Date();
                    const activeKeys = keysData.filter((k: AdminKey) => k.isActive).length;
                    const expiredKeys = keysData.filter((k: AdminKey) => k.expiredAt && new Date(k.expiredAt) < now).length;
                    setKeyStats({ total: keysData.length, active: activeKeys, expired: expiredKeys });
                }

                // Xá»­ lÃ½ vÃ  cáº­p nháº­t state cho Stats
                if (statsData) {
                    setBillingStats(statsData.billingStats);
                    setApiUsageStats(statsData.apiUsageStats);
                }

                // Cáº­p nháº­t state cho Providers vÃ  Logs
                setApiProviders(providersData || []);
                setAuditLogs(logsData || []);

            } catch (error: any) {
                message.error(error.message || 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u dashboard!');
            } finally {
                setLoading(false);
            }
        };
        getDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Äang táº£i dá»¯ liá»‡u há»‡ thá»‘ng..." />
            </div>
        );
    }
    
    const activeProvidersCount = apiProviders.filter(p => p.status === 'Operational').length;

    return (
        <div className="space-y-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-800">Tá»•ng Quan Há»‡ Thá»‘ng</h1>
            
            {/* Key Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">ðŸ“Š Thá»‘ng KÃª Key</h2>
                <Row gutter={16}>
                    <Col span={6}><StatCard title="Tá»•ng Sá»‘ Key" value={formatNumber(keyStats.total)} Icon={KeyRound}/></Col>
                    <Col span={6}><StatCard title="Key Äang Hoáº¡t Äá»™ng" value={formatNumber(keyStats.active)} Icon={Users}/></Col>
                    <Col span={6}><StatCard title="Key ÄÃ£ Háº¿t Háº¡n" value={formatNumber(keyStats.expired)} Icon={Activity} changeType="negative"/></Col>
                    {/* CÃ³ thá»ƒ thÃªm tá»•ng credit náº¿u cáº§n */}
                </Row>
            </div>

            {/* Billing Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">ðŸ’° Thá»‘ng KÃª Doanh Thu</h2>
                <Row gutter={16}>
                    <Col span={6}><StatCard title="Tá»•ng Doanh Thu" value={formatCurrency(billingStats.totalRevenue)} Icon={CreditCard}/></Col>
                    <Col span={6}><StatCard title="Giao Dá»‹ch ThÃ¡ng NÃ y" value={formatNumber(billingStats.monthlyTransactions)} Icon={Activity}/></Col>
                    {/* CÃ¡c thá»‘ng kÃª khÃ¡c cÃ³ thá»ƒ thÃªm sau */}
                </Row>
            </div>

            {/* API Providers & Usage Statistics */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">ðŸ§  Thá»‘ng KÃª Sá»­ Dá»¥ng API</h2>
                <Row gutter={16}>
                    <Col span={6}><StatCard title="Tá»•ng Sá»‘ Providers" value={formatNumber(apiProviders.length)} Icon={Cpu}/></Col>
                    <Col span={6}><StatCard title="Providers Hoáº¡t Äá»™ng" value={formatNumber(activeProvidersCount)} Icon={Shield}/></Col>
                    <Col span={6}><StatCard title="Tá»•ng Requests ToÃ n Há»‡ Thá»‘ng" value={formatNumber(apiUsageStats.totalRequests)} Icon={Cloud}/></Col>
                    <Col span={6}><StatCard title="Chi PhÃ­ Æ¯á»›c TÃ­nh HÃ´m Nay" value={`$${(apiUsageStats.costToday || 0).toFixed(2)}`} Icon={DollarSign}/></Col>
                </Row>
            </div>

            {/* Recent Activity & Provider Status */}
            <Row gutter={16}>
                <Col span={12}>
                    <AntCard title="ðŸ›¡ï¸ Hoáº¡t Äá»™ng Gáº§n ÄÃ¢y" size="small">
                        {auditLogs.length > 0 ? (
                            <List
                                size="small"
                                dataSource={auditLogs}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <div className="text-xs">
                                            <span className="text-gray-500 mr-2">[{new Date(item.timestamp).toLocaleString('vi-VN')}]</span>
                                            <span className="font-semibold text-blue-600">{item.action}:</span>
                                            <span className="ml-1">{item.details}</span>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="ChÆ°a cÃ³ hoáº¡t Ä‘á»™ng nÃ o" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </AntCard>
                </Col>
                <Col span={12}>
                    <AntCard title="ðŸ§  Tráº¡ng ThÃ¡i API Providers" size="small">
                        {apiProviders.length > 0 ? (
                            <div className="space-y-3">
                                {apiProviders.map(provider => (
                                    <div key={provider._id} className="flex justify-between items-center">
                                        <div className="font-medium">{provider.name}</div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">${(provider.costToday || 0).toFixed(2)}</span>
                                            <div className={`w-2 h-2 rounded-full ${
                                                provider.status === 'Operational' ? 'bg-green-500' : 
                                                provider.status === 'Error' ? 'bg-red-500' : 'bg-yellow-500' // Degraded
                                            }`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="ChÆ°a cÃ³ API providers nÃ o" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </AntCard>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;/ /   U p d a t e d :   2 0 2 5 - 0 7 - 1 0   0 9 : 2 4 : 5 1 
 
e x p o r t   d e f a u l t   A d m i n D a s h b o a r d ; 
 
 

export default AdminDashboard;
