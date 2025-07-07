import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message, Switch, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ManagedApiProvider, ApiProviderType } from '../types';
import { getApiProviders, saveApiProviders } from '../services/keyService';

const AdminApiProviders: React.FC = () => {
  const [providers, setProviders] = useState<ManagedApiProvider[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ManagedApiProvider | null>(null);
  const [form] = Form.useForm();
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    try {
      const loadedProviders = getApiProviders();
      if (loadedProviders.length === 0) {
        // Khởi tạo dữ liệu mẫu lần đầu
        const initialProviders: ManagedApiProvider[] = [
          {
            id: '1',
            provider: 'Gemini',
            apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            nickname: 'Gemini Production',
            status: 'Active',
            lastChecked: new Date().toISOString(),
            dailyUsage: 1250,
            monthlyUsage: 35000,
            costToday: 15.25,
            isDefault: true
          },
          {
            id: '2',
            provider: 'OpenAI',
            apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            nickname: 'OpenAI GPT-4',
            status: 'Active',
            lastChecked: new Date().toISOString(),
            dailyUsage: 800,
            monthlyUsage: 24000,
            costToday: 32.50,
            isDefault: false
          }
        ];
        saveApiProviders(initialProviders);
        setProviders(initialProviders);
      } else {
        setProviders(loadedProviders);
      }
    } catch (error) {
      message.error('Không thể tải danh sách API providers!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    setEditingProvider(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditProvider = (provider: ManagedApiProvider) => {
    setEditingProvider(provider);
    form.setFieldsValue(provider);
    setIsModalVisible(true);
  };

  const handleDeleteProvider = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa API provider này?',
      onOk: () => {
        const updatedProviders = providers.filter(p => p.id !== id);
        setProviders(updatedProviders);
        saveApiProviders(updatedProviders);
        message.success('Đã xóa API provider thành công!');
      }
    });
  };

  const handleSaveProvider = async () => {
    try {
      const values = await form.validateFields();
      const newProvider: ManagedApiProvider = {
        ...values,
        id: editingProvider?.id || Date.now().toString(),
        status: 'Active',
        lastChecked: new Date().toISOString(),
        dailyUsage: editingProvider?.dailyUsage || 0,
        monthlyUsage: editingProvider?.monthlyUsage || 0,
        costToday: editingProvider?.costToday || 0,
      };

      let updatedProviders: ManagedApiProvider[];
      if (editingProvider) {
        updatedProviders = providers.map(p => p.id === editingProvider.id ? newProvider : p);
        message.success('Cập nhật API provider thành công!');
      } else {
        updatedProviders = [...providers, newProvider];
        message.success('Thêm API provider thành công!');
      }
      
      setProviders(updatedProviders);
      saveApiProviders(updatedProviders);
      setIsModalVisible(false);
    } catch (error) {
      message.error('Vui lòng kiểm tra thông tin!');
    }
  };

  const handleSetDefault = (id: string) => {
    const updatedProviders = providers.map(p => ({ ...p, isDefault: p.id === id }));
    setProviders(updatedProviders);
    saveApiProviders(updatedProviders);
    message.success('Đã đặt làm provider mặc định!');
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Inactive': return 'default';
      case 'Error': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: ApiProviderType) => (
        <span className="font-semibold">{provider}</span>
      ),
    },
    {
      title: 'Tên Gợi Nhớ',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string, record: ManagedApiProvider) => (
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-2 py-1 rounded">
            {showKeys[record.id] ? key : maskApiKey(key)}
          </code>
          <Button
            type="text"
            size="small"
            icon={showKeys[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleKeyVisibility(record.id)}
          />
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ManagedApiProvider) => (
        <div className="flex items-center space-x-2">
          <Tag color={getStatusColor(status)}>{status}</Tag>
          {record.isDefault && <Tag color="blue">Mặc định</Tag>}
        </div>
      ),
    },
    {
      title: 'Sử dụng hôm nay',
      dataIndex: 'dailyUsage',
      key: 'dailyUsage',
      render: (usage: number) => `${usage.toLocaleString()} requests`,
    },
    {
      title: 'Chi phí hôm nay',
      dataIndex: 'costToday',
      key: 'costToday',
      render: (cost: number) => `$${cost.toFixed(2)}`,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: ManagedApiProvider) => (
        <div className="flex space-x-2">
          {!record.isDefault && (
            <Tooltip title="Đặt làm mặc định">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleSetDefault(record.id)}
              />
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditProvider(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProvider(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý API Providers</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddProvider}
        >
          Thêm API Provider
        </Button>
      </div>

      <Card>
        <Table
          dataSource={providers}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingProvider ? 'Chỉnh sửa API Provider' : 'Thêm API Provider mới'}
        open={isModalVisible}
        onOk={handleSaveProvider}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="provider"
            label="Provider"
            rules={[{ required: true, message: 'Vui lòng chọn provider!' }]}
          >
            <Select 
              placeholder="Chọn provider"
              options={[
                { value: 'Gemini', label: 'Google Gemini' },
                { value: 'OpenAI', label: 'OpenAI' },
                { value: 'DeepSeek', label: 'DeepSeek' },
                { value: 'Stability AI', label: 'Stability AI' },
                { value: 'ElevenLabs', label: 'ElevenLabs' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="Tên gợi nhớ"
            rules={[{ required: true, message: 'Vui lòng nhập tên gợi nhớ!' }]}
          >
            <Input placeholder="VD: Gemini Production, OpenAI GPT-4" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: 'Vui lòng nhập API Key!' }]}
          >
            <Input.Password placeholder="Nhập API Key của provider" />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked">
            <Switch /> Đặt làm provider mặc định
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminApiProviders; 