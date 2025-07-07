import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, message, Statistic, Row, Col } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined, TrophyOutlined, LineChartOutlined } from '@ant-design/icons';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  isPopular?: boolean;
}

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  amount: number;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
}

const AdminBilling: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    { id: '1', name: 'Gói Free', price: 0, credits: 1000, description: 'Gói miễn phí cho người dùng mới' },
    { id: '2', name: 'Gói Pro', price: 99000, credits: 10000, description: 'Gói phổ biến cho người dùng cá nhân', isPopular: true },
    { id: '3', name: 'Gói Enterprise', price: 299000, credits: 50000, description: 'Gói dành cho doanh nghiệp' },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', userId: 'user1', userEmail: 'user1@example.com', plan: 'Pro', amount: 99000, date: '2024-01-15', status: 'Success' },
    { id: '2', userId: 'user2', userEmail: 'user2@example.com', plan: 'Enterprise', amount: 299000, date: '2024-01-14', status: 'Success' },
    { id: '3', userId: 'user3', userEmail: 'user3@example.com', plan: 'Pro', amount: 99000, date: '2024-01-13', status: 'Pending' },
  ]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [form] = Form.useForm();

  // Statistics
  const totalRevenue = transactions.filter(t => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0);
  const pendingRevenue = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
  const monthlyTransactions = transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth()).length;

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue(plan);
    setEditModalVisible(true);
  };

  const handleSavePlan = async () => {
    try {
      const values = await form.validateFields();
      if (editingPlan) {
        setPricingPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...editingPlan, ...values } : p));
        message.success('Cập nhật gói cước thành công!');
      }
      setEditModalVisible(false);
      setEditingPlan(null);
    } catch (error) {
      message.error('Vui lòng kiểm tra thông tin!');
    }
  };

  const planColumns = [
    { title: 'Tên Gói', dataIndex: 'name', key: 'name' },
    { title: 'Giá (VNĐ)', dataIndex: 'price', key: 'price', render: (price: number) => price.toLocaleString('vi-VN') },
    { title: 'Credits', dataIndex: 'credits', key: 'credits', render: (credits: number) => credits.toLocaleString('vi-VN') },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { 
      title: 'Trạng thái', 
      key: 'status', 
      render: (_: any, record: PricingPlan) => record.isPopular ? <Tag color="gold">Phổ biến</Tag> : <Tag>Thường</Tag>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: PricingPlan) => (
        <Button size="small" onClick={() => handleEditPlan(record)}>Chỉnh sửa</Button>
      ),
    },
  ];

  const transactionColumns = [
    { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'Gói', dataIndex: 'plan', key: 'plan' },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ` },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const color = status === 'Success' ? 'green' : status === 'Pending' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-gray-800">Gói Cước & Thanh Toán</h1>
      
      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={totalRevenue}
              suffix="VNĐ"
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Doanh Thu Chờ Xử Lý"
              value={pendingRevenue}
              suffix="VNĐ"
              valueStyle={{ color: '#cf1322' }}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Giao Dịch Tháng Này"
              value={monthlyTransactions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ Lệ Thành Công"
              value={((transactions.filter(t => t.status === 'Success').length / transactions.length) * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Pricing Plans */}
      <Card title="Quản Lý Gói Cước">
        <Table 
          dataSource={pricingPlans} 
          columns={planColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Recent Transactions */}
      <Card title="Lịch Sử Giao Dịch Gần Đây">
        <Table 
          dataSource={transactions} 
          columns={transactionColumns}
          rowKey="id"
        />
      </Card>

      {/* Edit Plan Modal */}
      <Modal
        title="Chỉnh Sửa Gói Cước"
        open={editModalVisible}
        onOk={handleSavePlan}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Gói" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="credits" label="Credits" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBilling; 