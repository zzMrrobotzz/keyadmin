import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { Layout, Menu, Button, Card, Form, Input, message } from "antd";
import KeyManager from "./components/KeyManager";
import ApiProviderManager from "./components/ApiProviderManager";

const { Header, Content, Footer } = Layout;

// Thông tin tài khoản admin (hardcode)
const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";

const LoginPage = ({ onLogin }) => {
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const handleLogin = () => {
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      onLogin();
      message.success("Đăng nhập thành công!");
    } else {
      message.error("Sai tài khoản hoặc mật khẩu!");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="Đăng nhập Admin" style={{ width: 400 }}>
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item label="Tài khoản" required>
            <Input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} autoFocus />
          </Form.Item>
          <Form.Item label="Mật khẩu" required>
            <Input.Password value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("admin_logged_in"));

  const handleLogin = () => {
    localStorage.setItem("admin_logged_in", "1");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
            <Menu.Item key="1"><Link to="/">Quản lý Key</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/providers">Quản lý API</Link></Menu.Item>
          </Menu>
          <Button onClick={handleLogout} style={{ float: 'right', marginTop: 16 }}>Đăng xuất</Button>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content" style={{ background: '#fff', padding: 24, minHeight: 280, marginTop: 24 }}>
            <Routes>
              <Route path="/" element={<KeyManager />} />
              <Route path="/providers" element={<ApiProviderManager />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Admin Panel ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Router>
  );
}

export default App;