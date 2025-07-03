import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, message, Tag, Space, Modal, Input, Select, Form, Card } from "antd";
import { PlusOutlined } from '@ant-design/icons';

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

  // Hàm submit form tạo key mới
  const handleCreateKeySubmit = async (values) => {
    try {
      const response = await axios.post(`${API_BASE}/keys`, values);
      setNewKey(response.data.key);
      message.success(`Tạo key thành công: ${response.data.key}`);
      setShowCreateModal(false);
      form.resetFields();
      fetchKeys();
    } catch (err) {
      message.error("Tạo key thất bại!");
    }
  };

  // Thu hồi/khoá key
  const handleRevokeKey = async (key) => {
    // Hiện hộp thoại xác nhận đơn giản của trình duyệt
    if (window.confirm(`Bạn chắc chắn muốn thu hồi key này?\n${key}`)) {
      try {
        await axios.post(`${API_BASE}/keys/revoke`, { key });
        message.success("Đã thu hồi key!");
        fetchKeys(); // Cập nhật lại danh sách key
      } catch (err) {
        message.error("Thu hồi key thất bại!");
      }
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
    try {
      await axios.post(`${API_BASE}/keys/update-credit`, { key: selectedKey, amount: creditAmount });
      message.success('Cập nhật credit thành công!');
      setShowCreditModal(false);
      fetchKeys();
    } catch (err) {
      message.error('Cập nhật credit thất bại!');
    }
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (text) => <b>{text}</b>,
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
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreateKey}>
          Tạo Key mới
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
        <Select
          value={statusFilter}
          style={{ width: 150 }}
          onChange={(value) => {
            setStatusFilter(value);
            handleSearch(search, value);
          }}
        >
          <Select.Option value="all">Tất cả trạng thái</Select.Option>
          <Select.Option value="active">Hoạt động</Select.Option>
          <Select.Option value="revoked">Đã thu hồi</Select.Option>
        </Select>
      </Space>
      {newKey && (
        <div style={{ color: "green", marginBottom: 10 }}>
          Key mới: <b>{newKey}</b>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={filteredKeys.map((k) => ({ ...k, key: k.key }))}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
}

export default App;
