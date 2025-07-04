import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, message, Tag, Space, Modal, Input, Select, Form, Card, DatePicker, Spin, Badge, Drawer, List } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';

const API_BASE = "https://key-manager-backend.onrender.com/api";

// Thông tin tài khoản admin (hardcode)
const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";

function App() {
  // State cho đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("admin_logged_in"));
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // State cho quản lý key
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

  // Thống kê tổng quan
  const now = new Date();
  const totalKeys = keys.length;
  const activeKeys = keys.filter(k => k.isActive).length;
  const revokedKeys = keys.filter(k => !k.isActive).length;
  const expiredKeys = keys.filter(k => k.expiredAt && new Date(k.expiredAt) < now).length;
  const totalCredit = keys.reduce((sum, k) => sum + (Number(k.credit) || 0), 0);
  const totalActiveCredit = keys.filter(k => k.isActive).reduce((sum, k) => sum + (Number(k.credit) || 0), 0);

  // Đăng nhập
  const handleLogin = () => {
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setIsLoggedIn(true);
      localStorage.setItem("admin_logged_in", "1");
      message.success("Đăng nhập thành công!");
    } else {
      message.error("Sai tài khoản hoặc mật khẩu!");
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("admin_logged_in");
  };

  // Lấy danh sách key
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
    if (isLoggedIn) fetchKeys();
  }, [isLoggedIn]);

  // Tạo key mới
  const handleCreateKey = () => {
    setShowCreateModal(true);
    setNewKey(null);
  };

  // Thêm log thao tác
  const addAuditLog = (msg) => setAuditLog(logs => [{ msg, time: new Date().toLocaleString() }, ...logs]);

  // Hàm submit form tạo key mới
  const handleCreateKeySubmit = async (values) => {
    setActionLoading(true);
    try {
      const payload = { ...values, credit: Number(values.credit) };
      const response = await axios.post(`${API_BASE}/keys`, payload);
      console.log('Tạo key trả về:', response.data);
      setNewKey(response.data.key);
      message.success(`Tạo key thành công: ${response.data.key}`);
      addAuditLog(`Tạo key mới: ${response.data.key} (credit: ${payload.credit})`);
      setShowCreateModal(false);
      form.resetFields();
      await fetchKeys();
    } catch (err) {
      message.error("Tạo key thất bại!");
      console.error('Lỗi tạo key:', err);
    }
    setActionLoading(false);
  };

  // Thu hồi/khoá key
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

  // Tìm kiếm key + lọc trạng thái
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
      const res = await axios.post(`${API_BASE}/keys/update-credit`, { key: selectedKey, amount: Number(creditAmount) });
      console.log('Cập nhật credit trả về:', res.data);
      message.success('Cập nhật credit thành công!');
      addAuditLog(`Cập nhật credit cho key: ${selectedKey} (${creditAmount > 0 ? '+' : ''}${creditAmount})`);
      setShowCreditModal(false);
      await fetchKeys();
    } catch (err) {
      message.error('Cập nhật credit thất bại!');
      console.error('Lỗi cập nhật credit:', err);
    }
    setActionLoading(false);
  };

  // Lọc nâng cao
  const handleAdvancedFilter = (value, type) => {
    let filtered = keys;
    // Lọc theo trạng thái
    if (statusFilter === "active") filtered = filtered.filter((k) => k.isActive);
    else if (statusFilter === "revoked") filtered = filtered.filter((k) => !k.isActive);
    // Lọc theo credit
    if (creditFilter !== "") {
      const num = Number(creditFilter);
      if (!isNaN(num)) {
        if (creditFilterType === ">=") filtered = filtered.filter(k => (Number(k.credit) || 0) >= num);
        else if (creditFilterType === "<=") filtered = filtered.filter(k => (Number(k.credit) || 0) <= num);
        else if (creditFilterType === "=") filtered = filtered.filter(k => (Number(k.credit) || 0) === num);
      }
    }
    // Lọc theo ngày tạo
    if (createdAtRange.length === 2) {
      const [start, end] = createdAtRange;
      filtered = filtered.filter(k => {
        const d = new Date(k.createdAt);
        return d >= start.startOf('day').toDate() && d <= end.endOf('day').toDate();
      });
    }
    // Lọc theo ngày hết hạn
    if (expiredAtRange.length === 2) {
      const [start, end] = expiredAtRange;
      filtered = filtered.filter(k => {
        if (!k.expiredAt) return false;
        const d = new Date(k.expiredAt);
        return d >= start.startOf('day').toDate() && d <= end.endOf('day').toDate();
      });
    }
    setFilteredKeys(filtered);
  };

  // Hàm xuất CSV
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

  // Badge cảnh báo cho key sắp hết credit/hết hạn
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
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (text, record) => <span><b>{text}</b> {getKeyWarning(record)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) =>
        active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã thu hồi</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiredAt",
      key: "expiredAt",
      render: (date) => date ? new Date(date).toLocaleDateString() : "---",
    },
    {
      title: "Số máy tối đa",
      dataIndex: "maxActivations",
      key: "maxActivations",
      render: (num) => num || 1,
    },
    {
      title: "Số credit",
      dataIndex: "credit",
      key: "credit",
      render: (num) => num ?? 0,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (text) => text || "---",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) =>
        record.isActive ? (
          <span>
            <Button danger onClick={() => handleRevokeKey(record.key)} style={{ marginRight: 8 }}>
              Thu hồi
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => handleOpenCreditModal(record)}>
              Cộng/Trừ credit
            </Button>
          </span>
        ) : (
          <span>---</span>
        ),
    },
  ];

  // Nếu chưa đăng nhập, chỉ hiện form login
  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: "100px auto" }}>
        <Card title="Đăng nhập Admin" bordered>
          <Form
            onFinish={handleLogin}
            layout="vertical"
            style={{ marginTop: 20 }}
          >
            <Form.Item label="Tài khoản" required>
              <Input
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoFocus
              />
            </Form.Item>
            <Form.Item label="Mật khẩu" required>
              <Input.Password
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  // Nếu đã đăng nhập, hiện giao diện quản lý key
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ textAlign: "center" }}>Quản lý Key Bản Quyền</h1>
        <Button onClick={handleLogout}>Đăng xuất</Button>
      </div>
      {/* Bảng thống kê tổng quan */}
      <div style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Tổng số key</b><br />{totalKeys}
        </div>
        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Key hoạt động</b><br />{activeKeys}
        </div>
        <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Key thu hồi</b><br />{revokedKeys}
        </div>
        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Key hết hạn</b><br />{expiredKeys}
        </div>
        <div style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Tổng credit</b><br />{totalCredit}
        </div>
        <div style={{ background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <b>Credit key hoạt động</b><br />{totalActiveCredit}
        </div>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreateKey}>
          Tạo Key mới
        </Button>
        <Button onClick={handleExportCSV}>
          Xuất CSV
        </Button>
        <Button onClick={() => setShowLogDrawer(true)} style={{ marginLeft: 8 }}>
          Xem log thao tác
        </Button>
        <Modal
          title="Tạo Key mới"
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateKeySubmit}>
            <Form.Item label="Ngày hết hạn" name="expiredAt">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Số máy tối đa" name="maxActivations" initialValue={1}>
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item
              label="Số credit"
              name="credit"
              initialValue={0}
              rules={[{ type: 'number', min: 0, message: 'Credit phải >= 0' }]}
              getValueFromEvent={e => Number(e.target.value)}
            >
              <Input type="number" min={0} placeholder="Nhập số credit cho key (mặc định 0)" />
            </Form.Item>
            <Form.Item label="Ghi chú" name="note">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Tạo Key
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={`Cộng/Trừ credit cho key: ${selectedKey}`}
          open={showCreditModal}
          onCancel={() => setShowCreditModal(false)}
          onOk={handleUpdateCredit}
          okText="Cập nhật"
          cancelText="Hủy"
        >
          <Input
            type="number"
            value={creditAmount}
            onChange={e => setCreditAmount(Number(e.target.value))}
            placeholder="Nhập số credit muốn cộng (dương) hoặc trừ (âm)"
          />
          <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
            VD: Nhập 5 để cộng 5 credit, nhập -2 để trừ 2 credit
          </div>
        </Modal>
        <Input.Search
          placeholder="Tìm kiếm key hoặc trạng thái..."
          value={search}
          onChange={(e) => handleSearch(e.target.value, statusFilter)}
          style={{ width: 300 }}
          allowClear
        />
        {/* Bộ lọc nâng cao */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Select value={statusFilter} style={{ width: 150 }} onChange={(value) => { setStatusFilter(value); handleAdvancedFilter(); }}>
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="active">Hoạt động</Select.Option>
            <Select.Option value="revoked">Đã thu hồi</Select.Option>
          </Select>
          <Select value={creditFilterType} style={{ width: 70 }} onChange={v => { setCreditFilterType(v); handleAdvancedFilter(); }}>
            <Select.Option value=">=">&gt;=</Select.Option>
            <Select.Option value="<=">&lt;=</Select.Option>
            <Select.Option value="=">=</Select.Option>
          </Select>
          <Input
            placeholder="Số credit"
            style={{ width: 100 }}
            value={creditFilter}
            onChange={e => { setCreditFilter(e.target.value); handleAdvancedFilter(); }}
            type="number"
            min={0}
          />
          <DatePicker.RangePicker
            style={{ width: 240 }}
            placeholder={["Ngày tạo từ", "đến"]}
            onChange={v => { setCreatedAtRange(v || []); handleAdvancedFilter(); }}
            allowClear
          />
          <DatePicker.RangePicker
            style={{ width: 240 }}
            placeholder={["Ngày hết hạn từ", "đến"]}
            onChange={v => { setExpiredAtRange(v || []); handleAdvancedFilter(); }}
            allowClear
          />
        </div>
      </Space>
      {newKey && (
        <div style={{ color: "green", marginBottom: 10 }}>
          Key mới: <b>{newKey}</b>
        </div>
      )}
      <Spin spinning={loading || actionLoading} tip="Đang xử lý...">
        <Table
          columns={columns}
          dataSource={filteredKeys.map((k) => ({ ...k, key: k.key }))}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
        />
      </Spin>
      <Drawer
        title="Lịch sử thao tác (Audit log)"
        placement="right"
        open={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
        width={400}
      >
        <List
          dataSource={auditLog}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={item.msg}
                description={item.time}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
}

export default App;
