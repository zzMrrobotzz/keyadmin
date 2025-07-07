import React, { useState, useEffect, useMemo } from 'react';
import { fetchKeys, createKey, revokeKey, updateCredit } from '../services/keyService';
import { AdminKey } from '../types';
import { Button, Modal, Input, message, Table, Tag, Space, Select, DatePicker, Form, InputNumber, Switch } from 'antd';
import { saveAs } from 'file-saver';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminKeyManagement: React.FC = () => {
    const [keys, setKeys] = useState<AdminKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingKey, setEditingKey] = useState<AdminKey | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [trialFilter, setTrialFilter] = useState('all');
    const [form] = Form.useForm();

    const loadKeys = async () => {
        setLoading(true);
        try {
            const data = await fetchKeys();
            // Map backend data to frontend format
            const mappedData = data.map((key: any) => ({
                ...key,
                id: key._id, // Map _id to id for frontend
                isTrial: key.isTrial || false, // Default false if not exists
                maxActivations: key.maxActivations || 1 // Default 1 if not exists
            }));
            setKeys(mappedData);
        } catch (error) {
            message.error('Không thể tải danh sách key!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const filteredKeys = useMemo(() => {
        return keys.filter(key => {
            const matchSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) || (key.note && key.note.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? key.isActive : !key.isActive);
            const matchTrial = trialFilter === 'all' || (trialFilter === 'trial' ? key.isTrial : !key.isTrial);
            return matchSearch && matchStatus && matchTrial;
        });
    }, [keys, searchTerm, statusFilter, trialFilter]);

    const handleCreate = () => {
        setEditingKey(null);
        form.resetFields();
        form.setFieldsValue({ credit: 0, isActive: true, isTrial: false, maxActivations: 1 });
        setIsModalVisible(true);
    };

    const handleEdit = (record: AdminKey) => {
        setEditingKey(record);
        form.setFieldsValue({
            ...record,
            expiredAt: record.expiredAt ? dayjs(record.expiredAt) : null,
        });
        setIsModalVisible(true);
    };
    
    const handleCreditUpdate = async (record: AdminKey) => {
        let amount = prompt(`Nhập số credit muốn CỘNG/TRỪ cho key:\n${record.key}\n(Nhập số âm để trừ)`, "0");
        if (amount === null) return;
        const creditAmount = parseInt(amount, 10);
        if (isNaN(creditAmount) || creditAmount === 0) {
            message.warning('Vui lòng nhập một số hợp lệ và khác 0.');
            return;
        }

        try {
            await updateCredit(record.key, creditAmount); // Dùng key thay vì id
            message.success(`Đã cập nhật credit cho key!`);
            loadKeys();
        } catch (error) {
            message.error('Cập nhật credit thất bại!');
        }
    };


    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            console.log('Form values:', values); // Debug log
            
            // Only send fields that backend expects
            const payload = {
                key: values.key,
                credit: Number(values.credit) || 0,
                note: values.note || '',
                expiredAt: values.expiredAt ? values.expiredAt.toISOString() : null,
                isActive: Boolean(values.isActive),
                maxActivations: Number(values.maxActivations) || 1
            };

            console.log('Payload to send:', payload); // Debug log

            if (editingKey) {
                // Update logic (chưa có API, tạm thời ẩn)
                // await updateKey(editingKey.id, payload);
                message.info("Tính năng cập nhật chưa được hỗ trợ từ API.");
            } else {
                await createKey(payload);
                message.success('Tạo key thành công!');
                setIsModalVisible(false);
                loadKeys();
            }
        } catch (error: any) {
            console.error('Error details:', error); // Debug log
            if (error?.name === 'ValidationError') {
                message.error('Vui lòng kiểm tra lại thông tin đã nhập!');
            } else {
                message.error(`Thao tác thất bại: ${error?.message || error}`);
            }
        }
    };

    const handleExportCSV = () => {
        const header = ['Key', 'Credit', 'Note', 'Status', 'Trial', 'Expired At', 'Created At'];
        const rows = filteredKeys.map(k => [k.key, k.credit, k.note, k.isActive ? 'Active' : 'Inactive', k.isTrial ? 'Yes' : 'No', k.expiredAt, k.createdAt]);
        const csvContent = [header, ...rows].map(row => row.map(String).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'keys_export.csv');
    };

    const columns = [
        { title: 'Key', dataIndex: 'key', key: 'key', render: (text:string, record: AdminKey) => <a onClick={() => handleEdit(record)}>{text}</a> },
        { title: 'Credit', dataIndex: 'credit', key: 'credit', sorter: (a: AdminKey, b: AdminKey) => a.credit - b.credit },
        { title: 'Max Activations', dataIndex: 'maxActivations', key: 'maxActivations' },
        { title: 'Note', dataIndex: 'note', key: 'note' },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        { title: 'Trial', dataIndex: 'isTrial', key: 'isTrial', render: (isTrial: boolean) => (isTrial ? <Tag color="blue">Trial</Tag> : null) },
        { title: 'Expired At', dataIndex: 'expiredAt', key: 'expiredAt', render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-' },
        { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => dayjs(date).format('DD/MM/YYYY') },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: AdminKey) => (
                <Space>
                    <Button type="primary" onClick={() => handleCreditUpdate(record)}>+/- Credit</Button>
                    <Button onClick={() => handleEdit(record)}>Sửa</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Quản Lý Key</h1>
            <Space className="flex-wrap">
                <Input.Search placeholder="Tìm kiếm key hoặc note..." onSearch={setSearchTerm} style={{ width: 240 }} allowClear />
                <Select defaultValue="all" onChange={setStatusFilter} style={{ width: 120 }}>
                    <Option value="all">Mọi trạng thái</Option>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                </Select>
                 <Select defaultValue="all" onChange={setTrialFilter} style={{ width: 120 }}>
                    <Option value="all">Mọi loại key</Option>
                    <Option value="trial">Trial</Option>
                    <Option value="normal">Normal</Option>
                </Select>
                <Button type="primary" onClick={handleCreate}>Tạo Key Mới</Button>
                <Button onClick={handleExportCSV}>Xuất CSV</Button>
            </Space>
            <Table
                columns={columns}
                dataSource={filteredKeys}
                loading={loading}
                rowKey="id"
                scroll={{ x: 'max-content' }}
            />
            <Modal
                title={editingKey ? 'Sửa Key' : 'Tạo Key Mới'}
                open={isModalVisible}
                onOk={handleFormSubmit}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Vui lòng nhập key!' }]}>
                        <Input disabled={!!editingKey} />
                    </Form.Item>
                    <Form.Item name="credit" label="Credit" rules={[{ required: true, message: 'Vui lòng nhập số credit!' }]}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="maxActivations" label="Max Activations" rules={[{ required: true, message: 'Vui lòng nhập số lần kích hoạt tối đa!' }]}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="note" label="Note (Ghi chú)">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="expiredAt" label="Ngày hết hạn">
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                     <Form.Item name="isTrial" label="Key dùng thử" valuePropName="checked">
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminKeyManagement; 