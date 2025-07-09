import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, message, Tag, Space, Modal, Input, Select, Form, Card, DatePicker, Spin, Badge, Drawer, List } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';

const API_BASE = "https://key-manager-backend.onrender.com/api";

const KeyManager = () => {
    // All the state and functions from the original App.js are moved here
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newKey, setNewKey] = useState(null);
    const [search, setSearch] = useState("");
    const [filteredKeys, setFilteredKeys] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form] = Form.useForm();
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [creditAmount, setCreditAmount] = useState(0);
    const [creditFilter, setCreditFilter] = useState('');
    const [creditFilterType, setCreditFilterType] = useState('>=');
    const [createdAtRange, setCreatedAtRange] = useState([]);
    const [expiredAtRange, setExpiredAtRange] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [auditLog, setAuditLog] = useState([]);
    const [showLogDrawer, setShowLogDrawer] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingKey, setEditingKey] = useState(null);

    const now = new Date();
    const totalKeys = keys.length;
    const activeKeys = keys.filter(k => k.isActive).length;
    const revokedKeys = keys.filter(k => !k.isActive).length;
    const expiredKeys = keys.filter(k => k.expiredAt && new Date(k.expiredAt) < now).length;
    const totalCredit = keys.reduce((sum, k) => sum + (Number(k.credit) || 0), 0);
    const totalActiveCredit = keys.filter(k => k.isActive).reduce((sum, k) => sum + (Number(k.credit) || 0), 0);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/keys`);
            setKeys(response.data);
            setFilteredKeys(response.data);
        } catch (err) {
            message.error("Không lấy được danh sách key!");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleCreateKey = () => {
        setShowCreateModal(true);
        setNewKey(null);
    };

    const addAuditLog = (msg) => setAuditLog(logs => [{ msg, time: new Date().toLocaleString() }, ...logs]);

    const handleCreateKeySubmit = async (values) => {
        setActionLoading(true);
        try {
            const payload = { ...values, credit: Number(values.credit) };
            const response = await axios.post(`${API_BASE}/keys`, payload);
            setNewKey(response.data.key);
            message.success(`Tạo key thành công: ${response.data.key}`);
            addAuditLog(`Tạo key mới: ${response.data.key} (credit: ${payload.credit})`);
            setShowCreateModal(false);
            form.resetFields();
            await fetchKeys();
        } catch (err) {
            message.error("Tạo key thất bại!");
        }
        setActionLoading(false);
    };

    const handleRevokeKey = async (key) => {
        if (window.confirm(`Bạn chắc chắn muốn thu hồi key này?\n${key}`)) {
            setActionLoading(true);
            try {
                await axios.post(`${API_BASE}/keys/revoke`, { key });
                message.success("Đã thu hồi key!");
                addAuditLog(`Thu hồi key: ${key}`);
                fetchKeys();
            } catch (err) {
                message.error("Thu hồi key thất bại!");
            }
            setActionLoading(false);
        }
    };

    const handleSearch = (value = search, status = statusFilter) => {
        setSearch(value);
        let filtered = keys;
        if (value) {
            filtered = filtered.filter(
                (k) =>
                k.key.toLowerCase().includes(value.toLowerCase()) ||
                (k.isActive ? "hoạt động" : "đã thu hồi").includes(value.toLowerCase())
            );
        }
        if (status === "active") {
            filtered = filtered.filter((k) => k.isActive);
        } else if (status === "revoked") {
            filtered = filtered.filter((k) => !k.isActive);
        }
        setFilteredKeys(filtered);
    };

    const handleOpenCreditModal = (record) => {
        setSelectedKey(record.key);
        setCreditAmount(0);
        setShowCreditModal(true);
    };

    const handleUpdateCredit = async () => {
        if (isNaN(creditAmount) || creditAmount === 0) {
            message.error('Vui lòng nhập số credit khác 0!');
            return;
        }
        setActionLoading(true);
        try {
            await axios.post(`${API_BASE}/keys/update-credit`, { key: selectedKey, amount: Number(creditAmount) });
            message.success('Cập nhật credit thành công!');
            addAuditLog(`Cập nhật credit cho key: ${selectedKey} (${creditAmount > 0 ? '+' : ''}${creditAmount})`);
            setShowCreditModal(false);
            await fetchKeys();
        } catch (err) {
            message.error('Cập nhật credit thất bại!');
        }
        setActionLoading(false);
    };
    
    const handleUpdateKeySubmit = async (values) => {
        setActionLoading(true);
        try {
            const payload = { ...values, credit: Number(values.credit) };
            await axios.put(`${API_BASE}/keys/${editingKey._id}`, payload);
            message.success('Cập nhật key thành công!');
            addAuditLog(`Cập nhật key: ${editingKey.key}`);
            setShowEditModal(false);
            setEditingKey(null);
            await fetchKeys();
        } catch (err) {
            message.error('Cập nhật key thất bại!');
        }
        setActionLoading(false);
    };

    const handleAdvancedFilter = () => {
        let filtered = keys;
        if (statusFilter === "active") filtered = filtered.filter((k) => k.isActive);
        else if (statusFilter === "revoked") filtered = filtered.filter((k) => !k.isActive);
        if (creditFilter !== "") {
            const num = Number(creditFilter);
            if (!isNaN(num)) {
                if (creditFilterType === ">=") filtered = filtered.filter(k => (Number(k.credit) || 0) >= num);
                else if (creditFilterType === "<=") filtered = filtered.filter(k => (Number(k.credit) || 0) <= num);
                else if (creditFilterType === "=") filtered = filtered.filter(k => (Number(k.credit) || 0) === num);
            }
        }
        if (createdAtRange.length === 2) {
            const [start, end] = createdAtRange;
            filtered = filtered.filter(k => new Date(k.createdAt) >= start.startOf('day').toDate() && new Date(k.createdAt) <= end.endOf('day').toDate());
        }
        if (expiredAtRange.length === 2) {
            const [start, end] = expiredAtRange;
            filtered = filtered.filter(k => k.expiredAt && new Date(k.expiredAt) >= start.startOf('day').toDate() && new Date(k.expiredAt) <= end.endOf('day').toDate());
        }
        setFilteredKeys(filtered);
    };

    const handleExportCSV = () => {
        if (!keys.length) {
            message.warning('Không có dữ liệu để xuất!');
            return;
        }
        const header = ['Key', 'Trạng thái', 'Ngày tạo', 'Ngày hết hạn', 'Số máy tối đa', 'Số credit', 'Ghi chú'];
        const rows = keys.map(k => [
            k.key,
            k.isActive ? 'Hoạt động' : 'Đã thu hồi',
            new Date(k.createdAt).toLocaleString(),
            k.expiredAt ? new Date(k.expiredAt).toLocaleDateString() : '',
            k.maxActivations || 1,
            k.credit ?? 0,
            k.note || ''
        ]);
        const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `danhsach_key_${new Date().toISOString().slice(0,10)}.csv`);
    };

    const getKeyWarning = (record) => {
        const credit = Number(record.credit) || 0;
        let expired = false;
        let soonExpire = false;
        if (record.expiredAt) {
            const now = new Date();
            const exp = new Date(record.expiredAt);
            expired = exp < now;
            soonExpire = !expired && (exp - now < 7 * 24 * 60 * 60 * 1000);
        }
        if (credit < 5 && credit > 0) return <Badge color="orange" text="Sắp hết credit" />;
        if (credit === 0) return <Badge color="red" text="Hết credit" />;
        if (expired) return <Badge color="red" text="Đã hết hạn" />;
        if (soonExpire) return <Badge color="gold" text="Sắp hết hạn" />;
        return null;
    };

    const columns = [
        { title: "Key", dataIndex: "key", key: "key", render: (text, record) => <span><b>{text}</b> {getKeyWarning(record)}</span> },
        { title: "Trạng thái", dataIndex: "isActive", key: "isActive", render: (active) => active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã thu hồi</Tag> },
        { title: "Ngày tạo", dataIndex: "createdAt", key: "createdAt", render: (date) => new Date(date).toLocaleString() },
        { title: "Ngày hết hạn", dataIndex: "expiredAt", key: "expiredAt", render: (date) => date ? new Date(date).toLocaleDateString() : "---" },
        { title: "Số máy tối đa", dataIndex: "maxActivations", key: "maxActivations", render: (num) => num || 1 },
        { title: "Số credit", dataIndex: "credit", key: "credit", render: (num) => num ?? 0 },
        { title: "Ghi chú", dataIndex: "note", key: "note", render: (text) => text || "---" },
        { title: "Hành động", key: "action", render: (_, record) => record.isActive ? (
            <Space>
                <Button danger onClick={() => handleRevokeKey(record.key)}>Thu hồi</Button>
                <Button icon={<PlusOutlined />} onClick={() => handleOpenCreditModal(record)}>Credit</Button>
            </Space>
        ) : (<span>---</span>) },
    ];

    return (
        <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center" }}>Quản lý Key Bản Quyền</h1>
            </div>
            <div style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
                <Card size="small"><b>Tổng số key:</b> {totalKeys}</Card>
                <Card size="small"><b>Key hoạt động:</b> {activeKeys}</Card>
                <Card size="small"><b>Key thu hồi:</b> {revokedKeys}</Card>
                <Card size="small"><b>Key hết hạn:</b> {expiredKeys}</Card>
                <Card size="small"><b>Tổng credit:</b> {totalCredit}</Card>
                <Card size="small"><b>Credit key hoạt động:</b> {totalActiveCredit}</Card>
            </div>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handleCreateKey}>Tạo Key mới</Button>
                <Button onClick={handleExportCSV}>Xuất CSV</Button>
                <Button onClick={() => setShowLogDrawer(true)}>Xem log thao tác</Button>
            </Space>
            <Input.Search placeholder="Tìm kiếm key..." value={search} onChange={(e) => handleSearch(e.target.value, statusFilter)} style={{ width: 300, marginBottom: 16 }} allowClear />
            <Spin spinning={loading || actionLoading} tip="Đang xử lý...">
                <Table columns={columns} dataSource={filteredKeys.map((k) => ({ ...k, key: k.key }))} rowKey="_id" pagination={{ pageSize: 8 }} />
            </Spin>
            {/* Modals and Drawer go here */}
        </div>
    );
};

export default KeyManager;
