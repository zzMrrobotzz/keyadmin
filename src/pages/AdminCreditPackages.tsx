import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, InputNumber, Switch, 
  message, Space, Typography, Divider, Tag, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined, 
  ReloadOutlined, DollarOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface CreditPackage {
  _id?: string;
  name: string;
  price: number;
  credits: number;
  bonus: string;
  isPopular: boolean;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AdminCreditPackages: React.FC = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [form] = Form.useForm();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://key-manager-backend.onrender.com/api/packages');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages || []);
      } else {
        message.error('Không thể tải danh sách gói credit');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      message.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (values: CreditPackage) => {
    try {
      const isEdit = editingPackage?._id;
      const url = isEdit 
        ? `https://key-manager-backend.onrender.com/api/packages/${editingPackage._id}`
        : 'https://key-manager-backend.onrender.com/api/packages';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      
      if (data.success) {
        message.success(isEdit ? 'Cập nhật gói thành công!' : 'Tạo gói mới thành công!');
        setModalVisible(false);
        setEditingPackage(null);
        form.resetFields();
        fetchPackages();
      } else {
        message.error(data.error || 'Thao tác thất bại');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      message.error('Lỗi kết nối server');
    }
  };

  const handleDelete = async (packageId: string) => {
    try {
      const response = await fetch(`https://key-manager-backend.onrender.com/api/packages/${packageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        message.success('Xóa gói thành công!');
        fetchPackages();
      } else {
        message.error(data.error || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      message.error('Lỗi kết nối server');
    }
  };

  const openModal = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      form.setFieldsValue(pkg);
    } else {
      setEditingPackage(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const columns = [
    {
      title: 'Tên Gói',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CreditPackage) => (
        <div>
          <strong>{text}</strong>
          {record.isPopular && <Tag color="gold" style={{ marginLeft: 8 }}>Phổ biến</Tag>}
          {!record.isActive && <Tag color="red" style={{ marginLeft: 8 }}>Tạm dừng</Tag>}
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          {price.toLocaleString()} VNĐ
        </Text>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {credits.toLocaleString()} credits
        </Text>
      ),
    },
    {
      title: 'Bonus',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (bonus: string) => bonus || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: CreditPackage) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => openModal(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa gói này?"
            onConfirm={() => handleDelete(record._id!)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <GiftOutlined /> Quản Lý Gói Credit
      </Title>
      <Text type="secondary">
        Quản lý các gói nạp credit cho người dùng
      </Text>
      
      <Divider />

      <Card 
        title="Danh Sách Gói Credit"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchPackages}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              Thêm Gói Mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="_id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Chưa có gói credit nào' }}
        />
      </Card>

      <Modal
        title={editingPackage ? 'Chỉnh Sửa Gói Credit' : 'Thêm Gói Credit Mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPackage(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
          initialValues={{
            isActive: true,
            isPopular: false,
            bonus: '🔥 Khuyến mại'
          }}
        >
          <Form.Item
            label="Tên Gói"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
          >
            <Input placeholder="VD: Gói Cơ Bản, Gói Premium..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="Giá (VNĐ)"
              name="price"
              rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="500000"
                style={{ width: '100%' }}
                min={1000}
                step={1000}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
              />
            </Form.Item>

            <Form.Item
              label="Số Credits"
              name="credits"
              rules={[{ required: true, message: 'Vui lòng nhập số credits' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="100"
                style={{ width: '100%' }}
                min={1}
                step={1}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Bonus Text"
            name="bonus"
          >
            <Input placeholder="VD: 🔥 Khuyến mại, 🌟 Tiết kiệm 33%" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Mô tả thêm về gói..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item
              name="isPopular"
              valuePropName="checked"
            >
              <Switch /> <Text style={{ marginLeft: 8 }}>Đánh dấu phổ biến</Text>
            </Form.Item>

            <Form.Item
              name="isActive"
              valuePropName="checked"
            >
              <Switch /> <Text style={{ marginLeft: 8 }}>Kích hoạt gói</Text>
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingPackage(null);
                form.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPackage ? 'Cập Nhật' : 'Tạo Gói'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCreditPackages;